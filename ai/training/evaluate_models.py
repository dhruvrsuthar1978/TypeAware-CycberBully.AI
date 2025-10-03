"""
Model Evaluation Script
Evaluates trained ML models and generates performance reports
"""

import os
import sys
import logging
from typing import Dict, Any, List
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import matplotlib.pyplot as plt
import seaborn as sns

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.models.model_manager import ModelManager
from ai.datasets.data_loader import load_csv_dataset, split_dataset

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelEvaluator:
    """
    Evaluates trained ML models
    """
    
    def __init__(self, models_dir: str = "ai/models/saved", reports_dir: str = "ai/training/reports"):
        self.model_manager = ModelManager(models_dir)
        self.reports_dir = reports_dir
        os.makedirs(reports_dir, exist_ok=True)
    
    def evaluate_model(self, model_name: str, test_texts: List[str], test_labels: List[int]) -> Dict[str, Any]:
        """
        Evaluate a specific model on test data.
        Args:
            model_name: Name of the model to evaluate
            test_texts: Test text samples
            test_labels: Test labels
        Returns:
            Evaluation metrics
        """
        logger.info(f"Evaluating model: {model_name}")
        
        # Load model
        model = self.model_manager.load_model(model_name)
        if not model:
            raise ValueError(f"Model {model_name} not found")
        
        # Load vectorizer
        vectorizer_path = None
        for filename in os.listdir(self.model_manager.models_dir):
            if filename.startswith(model_name) and filename.endswith('_vectorizer.pkl'):
                vectorizer_path = os.path.join(self.model_manager.models_dir, filename)
                break
        
        if not vectorizer_path:
            raise ValueError(f"Vectorizer not found for model {model_name}")
        
        import joblib
        vectorizer = joblib.load(vectorizer_path)
        
        # Vectorize test data
        X_test_vec = vectorizer.transform(test_texts)
        
        # Make predictions
        y_pred = model.predict(X_test_vec)
        
        # Calculate metrics
        report = classification_report(test_labels, y_pred, output_dict=True)
        conf_matrix = confusion_matrix(test_labels, y_pred)
        
        # ROC-AUC if binary classification
        roc_auc = None
        if len(set(test_labels)) == 2 and hasattr(model, 'predict_proba'):
            y_prob = model.predict_proba(X_test_vec)[:, 1]
            roc_auc = roc_auc_score(test_labels, y_prob)
        
        results = {
            'model_name': model_name,
            'accuracy': report['accuracy'],
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_score': report['weighted avg']['f1-score'],
            'confusion_matrix': conf_matrix.tolist(),
            'classification_report': report,
            'roc_auc': roc_auc
        }
        
        return results
    
    def evaluate_all_models(self, test_dataset_path: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Evaluate all available models on test data.
        Args:
            test_dataset_path: Path to test dataset CSV
        Returns:
            Evaluation results for each category
        """
        logger.info("Evaluating all models")
        
        # Load test data
        df = pd.read_csv(test_dataset_path)
        categories = df['category'].unique()
        
        results = {}
        
        for category in categories:
            logger.info(f"Evaluating models for category: {category}")
            category_df = df[df['category'] == category]
            
            if len(category_df) < 5:
                logger.warning(f"Insufficient test data for category {category}")
                continue
            
            test_texts = category_df['text'].tolist()
            test_labels = category_df['label'].tolist()
            
            category_results = []
            
            # Get available models for this category
            available_models = self.model_manager.list_models()
            
            for model_base_name in available_models.keys():
                if model_base_name.startswith(f"{category}_"):
                    model_name = model_base_name
                    try:
                        result = self.evaluate_model(model_name, test_texts, test_labels)
                        category_results.append(result)
                    except Exception as e:
                        logger.error(f"Error evaluating {model_name}: {e}")
            
            results[category] = category_results
        
        return results
    
    def generate_report(self, results: Dict[str, List[Dict[str, Any]]], filename: str = "evaluation_report.json"):
        """
        Generate a comprehensive evaluation report.
        Args:
            results: Evaluation results
            filename: Output filename
        """
        import json
        from datetime import datetime
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'results': results,
            'summary': {}
        }
        
        # Generate summary
        for category, category_results in results.items():
            if category_results:
                best_model = max(category_results, key=lambda x: x['f1_score'])
                report['summary'][category] = {
                    'best_model': best_model['model_name'],
                    'best_f1_score': best_model['f1_score'],
                    'best_accuracy': best_model['accuracy'],
                    'models_evaluated': len(category_results)
                }
        
        # Save report
        report_path = os.path.join(self.reports_dir, filename)
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Evaluation report saved: {report_path}")
        return report_path
    
    def plot_confusion_matrix(self, conf_matrix: List[List[int]], model_name: str, category: str):
        """
        Plot confusion matrix for a model.
        Args:
            conf_matrix: Confusion matrix
            model_name: Model name
            category: Category name
        """
        plt.figure(figsize=(8, 6))
        sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues')
        plt.title(f'Confusion Matrix - {model_name} ({category})')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        
        plot_path = os.path.join(self.reports_dir, f"{model_name}_{category}_confusion_matrix.png")
        plt.savefig(plot_path)
        plt.close()
        
        return plot_path

def main():
    """Main evaluation function"""
    evaluator = ModelEvaluator()
    
    # Example usage - replace with actual test dataset path
    test_dataset_path = "ai/datasets/data/cyberbullying_test_dataset.csv"
    
    if os.path.exists(test_dataset_path):
        results = evaluator.evaluate_all_models(test_dataset_path)
        report_path = evaluator.generate_report(results)
        
        # Print summary
        print("\nEvaluation Summary:")
        for category, category_results in results.items():
            print(f"\nCategory: {category}")
            for result in category_results:
                print(f"  {result['model_name']}: F1={result['f1_score']:.3f}, Acc={result['accuracy']:.3f}")
    else:
        logger.warning(f"Test dataset not found: {test_dataset_path}")
        logger.info("Please create the test dataset first")

if __name__ == "__main__":
    main()
