from flask import Flask, jsonify, request, send_file
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
from io import BytesIO
from pymongo import MongoClient

# Connexion à MongoDB
client = MongoClient("mongodb+srv://Asp3rity:J2s3jAsd@asp3rity.fd7yh.mongodb.net/osu-pp-benchmark-data?retryWrites=true&w=majority")
db = client['osu-pp-benchmark-data']  
collection = db['scores']  

app = Flask(__name__)

def plot_pp(identifier, is_username):
    # Récupérer les données de la base de données MongoDB
    query = {'username': identifier} if is_username else {'beatmapId': int(identifier)}
    cursor = collection.find(query)

    # Convertir les données MongoDB en DataFrame
    data = pd.DataFrame(list(cursor))
    if data.empty:
        return None
    
    # Trier les données par pp en ordre décroissant
    data = data.sort_values('actualPP', ascending=False)

    # Traitement des données
    data['playIndex'] = range(1, len(data) + 1)
    pp_cap = max(data['actualPP']) + 50

    # Création du graphe avec matplotlib
    plt.figure(figsize=(12, 8))
    plt.plot(data['playIndex'], data['ojsamaPP'], 'o-', color='blue', label='ojsamaPP', alpha=0.6, markersize=3)
    plt.plot(data['playIndex'], data['rosuPP'], 's-', color='green', label='rosuPP', alpha=0.6, markersize=3)
    plt.plot(data['playIndex'], data['otpcPP'], 'D-', color='purple', label='otpcPP', alpha=0.6, markersize=3)
    plt.plot(data['playIndex'], data['actualPP'], 'o-', color='red', label='actualPP', markersize=5, markeredgecolor='black', linewidth=2)
    
    plt.xlabel("Play Order")
    plt.ylabel("Performance Points (PP)")
    plt.title(f"Performance Points Comparison for {identifier}")
    plt.legend()
    plt.grid(visible=True, linestyle='--', alpha=0.7)
    plt.ylim(0, pp_cap)

    # Sauvegarder le graphe dans un objet BytesIO
    img = BytesIO()
    plt.savefig(img, format='png')
    plt.close()
    img.seek(0)
    return img

@app.route('/visualize')
def visualize():
    identifier = request.args.get('identifier')
    is_username = request.args.get('isUsername', 'false').lower() == 'true'
    if not identifier:
        return jsonify({'error': 'No identifier provided!'}), 400

    img = plot_pp(identifier, is_username)
    if img is None:
        return jsonify({"error": f"No data found for {'username' if is_username else 'beatmapId'}: {identifier}"}), 404
    
    # Retourner l'image comme réponse
    return send_file(img, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
