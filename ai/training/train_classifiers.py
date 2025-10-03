"""
Training Script for ML Classifiers
Trains machine learning models for cyberbullying detection
"""

import os
import sys
import logging
from typing import Dict, Any, List
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import joblib

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.datasets.data_loader import load_csv_dataset, split_dataset
from ai.models.model_manager import ModelManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MLTrainer:
    """
    Trainer class for ML models
    """
    
    def __init__(self, models_dir: str = "ai/models/saved"):
        self.model_manager = ModelManager(models_dir)
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.models = {
            'logistic_regression': LogisticRegression(random_state=42, max_iter=1000),
            'random_forest': RandomForestClassifier(random_state=42, n_estimators=100),
            'svm': SVC(random_state=42, kernel='linear', probability=True)
        }
    
    def train_model(self, model_name: str, texts: List[str], labels: List[int], 
                   category: str) -> Dict[str, Any]:
        """
        Train a specific model for a category.
        Args:
            model_name: Name of the model to train
            texts: Training texts
            labels: Training labels
            category: Category name (e.g., 'harassment', 'hate_speech')
        Returns:
            Training results and metrics
        """
        logger.info(f"Training {model_name} for category: {category}")
        
        # Split data
        X_train, X_test, y_train, y_test = split_dataset(texts, labels)
        
        # Vectorize text
        X_train_vec = self.vectorizer.fit_transform(X_train)
        X_test_vec = self.vectorizer.transform(X_test)
        
        # Handle class imbalance
        if len(set(y_train)) > 1:
            smote = SMOTE(random_state=42)
            X_train_vec, y_train = smote.fit_resample(X_train_vec, y_train)
        
        # Get model
        model = self.models.get(model_name)
        if not model:
            raise ValueError(f"Model {model_name} not found")
        
        # Hyperparameter tuning for Logistic Regression
        if model_name == 'logistic_regression':
            param_grid = {'C': [0.1, 1, 10]}
            grid_search = GridSearchCV(model, param_grid, cv=3, scoring='f1')
            grid_search.fit(X_train_vec, y_train)
            model = grid_search.best_estimator_
        
        # Train model
        model.fit(X_train_vec, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_vec)
        accuracy = accuracy_score(y_test, y_pred)
        report = classification_report(y_test, y_pred, output_dict=True)
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train_vec, y_train, cv=5, scoring='f1')
        
        results = {
            'accuracy': accuracy,
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_score': report['weighted avg']['f1-score'],
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'model_name': model_name,
            'category': category
        }
        
        # Save model
        metadata = {
            'accuracy': accuracy,
            'f1_score': results['f1_score'],
            'category': category,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
        
        model_path = self.model_manager.save_model(model, f"{category}_{model_name}", metadata)
        results['model_path'] = model_path
        
        # Save vectorizer
        vectorizer_path = model_path.replace('.pkl', '_vectorizer.pkl')
        joblib.dump(self.vectorizer, vectorizer_path)
        
        logger.info(f"Model trained and saved: {model_path}")
        return results
    
    def train_all_categories(self, dataset_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Train models for all categories in the dataset.
        Args:
            dataset_path: Path to CSV dataset with columns: text, category, label
        Returns:
            Results for each category and model
        """
        logger.info("Starting training for all categories")
        
        # Load dataset
        df = pd.read_csv(dataset_path)
        categories = df['category'].unique()
        
        results = {}
        
        for category in categories:
            logger.info(f"Training models for category: {category}")
            category_df = df[df['category'] == category]
            
            if len(category_df) < 10:
                logger.warning(f"Insufficient data for category {category}, skipping")
                continue
            
            texts = category_df['text'].tolist()
            labels = category_df['label'].tolist()
            
            category_results = []
            
            for model_name in self.models.keys():
                try:
                    result = self.train_model(model_name, texts, labels, category)
                    category_results.append(result)
                except Exception as e:
                    logger.error(f"Error training {model_name} for {category}: {e}")
            
            results[category] = category_results
        
        return results

    def train_multiclass_models(self, dataset_path: str) -> List[Dict[str, Any]]:
        """
        Train multi-class models for cyberbullying types.
        Args:
            dataset_path: Path to CSV dataset with columns: tweet_text, type
        Returns:
            Results for each model
        """
        logger.info("Starting multi-class training for cyberbullying types")

        # Load dataset
        texts, labels_str = load_csv_dataset(dataset_path, text_column="Tweet", label_column="Class")

        # Encode labels
        label_encoder = LabelEncoder()
        labels = label_encoder.fit_transform(labels_str)

        logger.info(f"Loaded {len(texts)} samples with {len(label_encoder.classes_)} classes: {list(label_encoder.classes_)}")

        results = []

        for model_name in self.models.keys():
            try:
                logger.info(f"Training {model_name} for multi-class classification")

                # Split data
                X_train, X_test, y_train, y_test = split_dataset(texts, labels)

                # Vectorize text
                X_train_vec = self.vectorizer.fit_transform(X_train)
                X_test_vec = self.vectorizer.transform(X_test)

                # Handle class imbalance
                if len(set(y_train)) > 1:
                    smote = SMOTE(random_state=42)
                    X_train_vec, y_train = smote.fit_resample(X_train_vec, y_train)

                # Get model
                model = self.models[model_name]

                # For multi-class, adjust models if needed
                if model_name == 'svm':
                    model = SVC(random_state=42, kernel='linear', probability=True, decision_function_shape='ovr')
                elif model_name == 'logistic_regression':
                    model = LogisticRegression(random_state=42, max_iter=1000, multi_class='ovr')

                # Hyperparameter tuning for Logistic Regression
                if model_name == 'logistic_regression':
                    param_grid = {'C': [0.1, 1, 10]}
                    grid_search = GridSearchCV(model, param_grid, cv=3, scoring='f1_macro')
                    grid_search.fit(X_train_vec, y_train)
                    model = grid_search.best_estimator_

                # Train model
                model.fit(X_train_vec, y_train)

                # Evaluate
                y_pred = model.predict(X_test_vec)
                accuracy = accuracy_score(y_test, y_pred)
                report = classification_report(y_test, y_pred, output_dict=True, target_names=label_encoder.classes_)

                # Cross-validation
                cv_scores = cross_val_score(model, X_train_vec, y_train, cv=5, scoring='f1_macro')

                result = {
                    'accuracy': accuracy,
                    'precision': report['weighted avg']['precision'],
                    'recall': report['weighted avg']['recall'],
                    'f1_score': report['weighted avg']['f1-score'],
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std(),
                    'model_name': model_name,
                    'category': 'cyberbullying_types',
                    'classes': list(label_encoder.classes_)
                }

                # Save model
                metadata = {
                    'accuracy': accuracy,
                    'f1_score': result['f1_score'],
                    'category': 'cyberbullying_types',
                    'training_samples': len(X_train),
                    'test_samples': len(X_test),
                    'classes': list(label_encoder.classes_)
                }

                model_path = self.model_manager.save_model(model, f"cyberbullying_types_{model_name}", metadata)
                result['model_path'] = model_path

                # Save vectorizer
                vectorizer_path = model_path.replace('.pkl', '_vectorizer.pkl')
                joblib.dump(self.vectorizer, vectorizer_path)

                # Save label encoder
                encoder_path = model_path.replace('.pkl', '_encoder.pkl')
                joblib.dump(label_encoder, encoder_path)

                logger.info(f"Model trained and saved: {model_path}")
                results.append(result)

            except Exception as e:
                logger.error(f"Error training {model_name}: {e}")

        return results

def main():
    """Main training function"""
    trainer = MLTrainer()

    # Use the CyberBullyingTypesDataset for multi-class training
    dataset_path = "ai/datasets/data/CyberBullyingTypesDataset.csv"

    if os.path.exists(dataset_path):
        results = trainer.train_multiclass_models(dataset_path)

        # Print summary
        print("\nMulti-class Cyberbullying Types Classification Results:")
        for result in results:
            print(f"  {result['model_name']}: F1={result['f1_score']:.3f}, Acc={result['accuracy']:.3f}, CV={result['cv_mean']:.3f}±{result['cv_std']:.3f}")
    else:
        logger.warning(f"Dataset not found: {dataset_path}")
        logger.info("Please ensure the dataset is available")

if __name__ == "__main__":
    main()
