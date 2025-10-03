"""
Cyberbullying Dataset Module
Provides functions to load and preprocess cyberbullying datasets
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from typing import Tuple

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def load_dataset(file_name: str) -> pd.DataFrame:
    """
    Load dataset CSV file into a pandas DataFrame.
    Args:
        file_name: Name of the CSV file in the data directory
    Returns:
        DataFrame with dataset
    """
    file_path = os.path.join(DATA_DIR, file_name)
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    df = pd.read_csv(file_path)
    return df

def preprocess_text(text: str) -> str:
    """
    Basic text preprocessing for dataset samples.
    Args:
        text: Raw text string
    Returns:
        Cleaned text string
    """
    # Lowercase
    text = text.lower()
    # Remove leading/trailing whitespace
    text = text.strip()
    # Additional preprocessing can be added here
    return text

def prepare_train_test_split(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42
                            ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Split dataset into training and testing sets.
    Args:
        df: DataFrame with columns ['text', 'label']
        test_size: Fraction of data to use for testing
        random_state: Random seed for reproducibility
    Returns:
        X_train, X_test, y_train, y_test
    """
    df['text'] = df['text'].apply(preprocess_text)
    X = df['text']
    y = df['label']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test
