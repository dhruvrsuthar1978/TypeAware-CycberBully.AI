"""
Data Loader Module
Provides utilities to load and preprocess datasets for training
"""

import os
import pandas as pd
from typing import List, Tuple, Dict
from sklearn.model_selection import train_test_split
from ai.datasets.cyberbullying_dataset import preprocess_text

def load_csv_dataset(file_path: str, text_column: str = "text", label_column: str = "label"
                    ) -> Tuple[List[str], List[int]]:
    """
    Load dataset from CSV file and preprocess text.
    Args:
        file_path: Path to CSV file
        text_column: Name of the text column
        label_column: Name of the label column
    Returns:
        texts: List of preprocessed text samples
        labels: List of integer labels
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    
    df = pd.read_csv(file_path)
    texts = df[text_column].astype(str).apply(preprocess_text).tolist()
    labels = df[label_column].tolist()
    return texts, labels

def split_dataset(texts: List[str], labels: List[int], test_size: float = 0.2, random_state: int = 42
                 ) -> Tuple[List[str], List[str], List[int], List[int]]:
    """
    Split dataset into training and testing sets.
    Args:
        texts: List of text samples
        labels: List of labels
        test_size: Fraction of data for testing
        random_state: Random seed
    Returns:
        X_train, X_test, y_train, y_test
    """
    return train_test_split(texts, labels, test_size=test_size, random_state=random_state, stratify=labels)
