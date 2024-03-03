import { pool } from "../config/connect.js";
import { Stagiaire } from "./stagiaire.js";
import { Encadrant } from "./encadrant.js";
import { Poste } from "./lieu_poste.js";
import { Region } from "./region.js";
class Stage {
    constructor(obj) {
        this.id = obj.id; 
        this.stagiaire = obj.stagiaire; // type stagiaire
        this.encadrant = (obj.encadrant ) ? obj.encadrant : null;; // type encadrant
        this.poste = (obj.poste ) ? obj.poste : null; // type poste
        this.date_demande = String(obj.date_demande);
        this.date_reponse = obj.date_reponse ?  String(obj.date_reponse) : null; 
        this.date_debut = String(obj.date_debut); 
        this.date_fin = String(obj.date_fin); 
        this.type = obj.type;
        this.region = obj.region;
        this.lieu_proposee = obj.lieu_proposee; 
        this.etat = obj.etat; 
        this.id_fiche_reponse = obj.id_fiche_reponse;
        this.id_fiche_reponse_signe = obj.id_fiche_reponse_signe;
        this.id_attestation = obj.id_attestation;
        this.id_lettre_affectation = obj.id_lettre_affectation;
    }
    static async getStage(id){
        let [stage,] = await pool.query(`select * from stage where id = ${id}`);
        stage[0].stagiaire = await Stagiaire.getStagiaire(stage[0].id_stagiaire);
        if(stage[0].id_Encadrant){
            stage[0].encadrant = await Encadrant.getEncadrant(stage[0].id_Encadrant);
        }
        if(stage[0].id_poste){
            stage[0].poste = await Poste.getPoste(stage[0].id_poste);
        }
        if(stage[0].id_region){
            stage[0].region = await Region.getRegion(stage[0].id_region);
        }
        let [type,]= await pool.query(`select * from type_stage where id = ${stage[0].id_type} `)
        stage[0].type = type[0].type;

        return new Stage(stage[0]);
        /* exemple of result
            {
                "id": 37,
                "stagiaire": {
                    "id": 42,
                    "nom": "minyar",
                    "prenom": "tmela",
                    "cin": 14526987,
                    "passport": null,
                    "region": {
                        "id": 5,
                        "region": "nabeul"
                    },
                    "institut": "isi Gabes",
                    "filiere": "licence en IT",
                    "tel": 26241626,
                    "email": "minyar1@gmail.com",
                    "password": "minyar123"
                },
                "encadrant": {
                    "id": 8,
                    "poste": {
                        "id": 7,
                        "region": {
                            "id": 6,
                            "region": "sousse"
                        },
                        "nom_residence": "bureau de poste - 7013",
                        "adresse": "Aïn Ghalel"
                    },
                    "nom": "Ava",
                    "prenom": "Mia",
                    "tel": 20603419,
                    "email": "Ava@gmail.com",
                    "specialite": "service6"
                },
                "poste": {
                    "id": 8,
                    "region": {
                        "id": 6,
                        "region": "sousse"
                    },
                    "nom_residence": "bureau de poste - 7012",
                    "adresse": "Bazina"
                },
                "date_demande": "2024-01-26T23:00:00.000Z",
                "date_reponse": null,
                "date_debut": "2024-08-01T23:00:00.000Z",
                "date_fin": "2024-08-28T23:00:00.000Z",
                "type": "perfectionnement",
                "lieu_proposee": "bardo",
                "etat": 0,
                "id_fiche_reponse": 167,
                "id_fiche_reponse_signe": null,
                "id_attestation": null,
                "id_lettre_affectation": null
            }
        */
    }

}
export {Stage}