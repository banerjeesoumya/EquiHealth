import pandas as pd
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import joblib


data = pd.read_csv('/Users/prarabdhatrey/Desktop/DiseasePrediction/api data - Sheet1.csv')

# Preprocessing
data['INPUT'] = data['INPUT'].str.lower()
data['INPUT'] = data['INPUT'].str.replace('"', '').str.split(", ")
data['OUTPUT'] = data['OUTPUT'].str.strip()

# Flatten INPUT for vectorization
data_flattened = data.explode('INPUT')

# Vectorize INPUT column
vectorizer = TfidfVectorizer()
X = vectorizer.fit_transform(data_flattened['INPUT'])
y = data_flattened['OUTPUT']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LogisticRegression()
model.fit(X_train, y_train)

def predict_medical_term(input_json):
    input_synonyms = input_json["input_synonyms"]
    input_vectorized = vectorizer.transform(input_synonyms)
    predictions = model.predict(input_vectorized)
    return {
        "input_synonyms": input_synonyms,
        "predicted_medical_term": predictions[0]  # Return first prediction for simplicity
    }


# Save the model and vectorizer as pickle files
joblib.dump(model, 'trained_model_symptom.pkl')
joblib.dump(vectorizer, 'vectorizer_symptom.pkl')

print("Model and vectorizer saved as pickle files.")