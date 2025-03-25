from flask import Flask, request, jsonify
import joblib  


app = Flask(__name__)

model1 = joblib.load('trained_model_symptom.pkl')  
vectorizer = joblib.load('vectorizer_symptom.pkl')  
model2 = joblib.load('disease_prediction_model.pkl')

@app.route('/predict_diseasem', methods=['POST'])
def predict_medical_term():
    try:
        input_synonyms = request.get_json(force=True)  
        
        if not isinstance(input_synonyms, list) or not input_synonyms:
            return jsonify({"error": "Invalid input. Provide a list of synonyms."}), 400
        
        input_vectorized = vectorizer.transform(input_synonyms)
        
        prediction = model1.predict(input_vectorized)
        
        predicted_medical_term = prediction.tolist()
        
        if not isinstance(predicted_medical_term, list) or not predicted_medical_term:
            return jsonify({"error": "Invalid input. Provide a list of predicted medical terms."}), 400
        
        diseases_prediction = model2.predict(predicted_medical_term)

        return jsonify({
            "predicted_diseases": diseases_prediction.tolist()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
