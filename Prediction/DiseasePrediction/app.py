from flask import Flask, request, jsonify
import joblib  
import numpy as np


app = Flask(__name__)

#model1 = joblib.load('trained_model_symptom.pkl')  
vectorizer = joblib.load('vectorizer_symptom.pkl')  
model2 = joblib.load('disease_prediction_model.pkl')
encoder=joblib.load('label_encoder.pkl')

@app.route('/predict', methods=['POST'])
def predict_disease():
    try:
        
        
        input_symptoms = request.get_json(force=True)  
        
        if not isinstance(input_symptoms["symptoms"], list) or not input_symptoms["symptoms"]:
            return jsonify({"error": "Invalid input. Provide a list of synonyms."}), 400
        
        #prediction = []        
        #for item in input_synonyms["symptoms"]:
        #    vectorized = vectorizer.transform([item])
        #    predict = model1.predict(vectorized)
        #    prediction.append(predict[0])
        #input_vectorized = vectorizer.transform(input_synonyms["symptoms"])
        #prediction = model1.predict(input_vectorized)
        #predicted_medical_term = prediction.tolist()
        #predicted_medical_term = prediction.tolist()
         
        symptoms_list = ['itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing', 'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity', 'ulcers_on_tongue', 'muscle_wasting', 'vomiting', 'burning_micturition', 'spotting_ urination', 'fatigue', 'weight_gain', 'anxiety', 'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness', 'lethargy', 'patches_in_throat', 'irregular_sugar_level', 'cough', 'high_fever', 'sunken_eyes', 'breathlessness', 'sweating', 'dehydration', 'indigestion', 'headache', 'yellowish_skin', 'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain', 'constipation', 'abdominal_pain', 'diarrhoea', 'mild_fever', 'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure', 'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes', 'malaise', 'blurred_and_distorted_vision', 'phlegm', 'throat_irritation', 'redness_of_eyes', 'sinus_pressure', 'runny_nose', 'congestion', 'chest_pain', 'weakness_in_limbs', 'fast_heart_rate', 'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool', 'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps', 'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels', 'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails', 'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts', 'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain', 'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness', 'spinning_movements', 'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort', 'foul_smell_of urine', 'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching', 'toxic_look_(typhos)', 'depression', 'irritability', 'muscle_pain', 'altered_sensorium', 'red_spots_over_body', 'belly_pain', 'abnormal_menstruation', 'dischromic _patches', 'watering_from_eyes', 'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum', 'rusty_sputum', 'lack_of_concentration', 'visual_disturbances', 'receiving_blood_transfusion', 'receiving_unsterile_injections', 'coma', 'stomach_bleeding', 'distention_of_abdomen', 'history_of_alcohol_consumption', 'fluid_overload.1', 'blood_in_sputum', 'prominent_veins_on_calf', 'palpitations', 'painful_walking', 'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling', 'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails', 'blister', 'red_sore_around_nose', 'yellow_crust_ooze']
        
        input_data = np.zeros(len(symptoms_list))
        
        for symptom in input_symptoms["symptoms"]:
            if symptom in symptoms_list:
                idx = symptoms_list.index(symptom)
                input_data[idx] = 1
            else:
                return jsonify({"error": f"Invalid input. Sympton '{symptom}' not found."}), 400
                
        encoded = model2.predict([input_data])[0]
        diseases_prediction = encoder.inverse_transform([encoded])[0]
        
        # Dictionary mapping diseases to related departments
        disease_to_departments = {
            "Fungal Infection": ["General Medicine","Infectious Diseases"],
            "Allergy": ["Allergy & Immunology"],
            "GERD": ["Gastroenterology"],
            "Chronic Cholestasis": ["Gastroenterology", "Hepatology"],
            "Drug Reaction": ["Allergy & Immunology", "Dermatology"],
            "Peptic Ulcer Disease": ["Gastroenterology"],
            "AIDS": ["Infectious Diseases", "HIV Clinic"],
            "Diabetes": ["Diabetology", "Endocrinology"],
            "Gastroenteritis": ["Gastroenterology"],
            "Bronchial Asthma": ["Pulmonology", "Allergy & Immunology"],
            "Hypertension": ["General Medicine", "Cardiology"],
            "Migraine": ["Neurology", "Headache Clinic"],
            "Cervical Spondylosis": ["Orthopedics", "Spine Specialist"],
            "Paralysis (brain hemorrhage)": ["Neurology", "Neurosurgery"],
            "Jaundice": ["Gastroenterology", "Hepatology"],
            "Malaria": ["Infectious Diseases", "General Medicine"],
            "Chickenpox": ["General Medicine", "Pediatrics"],
            "Dengue": ["Infectious Diseases", "General Medicine"],
            "Typhoid": ["Infectious Diseases", "General Medicine"],
            "Hepatitis A": ["Gastroenterology", "Hepatology"],
            "Hepatitis B": ["Gastroenterology", "Hepatology"],
            "Hepatitis C": ["Gastroenterology", "Hepatology"],
            "Hepatitis D": ["Gastroenterology", "Hepatology"],
            "Hepatitis E": ["Gastroenterology", "Hepatology"],
            "Alcoholic Hepatitis": ["Gastroenterology", "Hepatology"],
            "Tuberculosis": ["Pulmonology", "Infectious Diseases"],
            "Common Cold": ["General Medicine", "Family Medicine"],
            "Pneumonia": ["Pulmonology", "General Medicine"],
            "Dimorphic Hemorrhoids (piles)": ["General Surgery", "Gastroenterology"],
            "Heart Attack": ["Cardiology"],
            "Varicose Veins": ["Vascular Surgery", "General Surgery"],
            "Hypothyroidism": ["Endocrinology"],
            "Hypoglycemia": ["Endocrinology", "Diabetology"],
            "Osteoarthritis": ["Orthopedics", "Rheumatology"],
            "Arthritis": ["Rheumatology", "Orthopedics"],
            "Vertigo": ["Neurology", "ENT"],
            "Acne": ["Dermatology"],
            "Urinary Tract Infection": ["Urology", "General Medicine"],
            "Psoriasis": ["Dermatology"],
            "Impetigo": ["Dermatology"]
        }

        # Function to get related departments for a disease
        
        diseases_prediction = diseases_prediction.strip()
        if diseases_prediction in disease_to_departments:
            department = disease_to_departments[diseases_prediction]
        else:
            return jsonify({"error": f"Invalid Disease detected."}), 400


        return jsonify({
            "predicted_diseases": diseases_prediction,
            "related_departments": department
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

if __name__ == '__main__':
    app.run(debug=True)
