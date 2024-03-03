import { pool } from "../config/connect.js"
import { Poste } from "./lieu_poste.js"
class Encadrant{
    constructor(obj){
        this.id = obj.id
        this.poste = obj.poste // type lieu poste
        this.nom = obj.nom
        this.prenom = obj.prenom
        this.tel = obj.tel
        this.email = obj.email
        this.specialite = obj.specialite
    }
    static async getEncadrant(id){
        let [result,] = await pool.query(`select * from encadrant where id = ${id}`);
        result[0].poste = await Poste.getPoste(result[0].id_poste);
        return new Encadrant(result[0]);
    }
}
export {Encadrant}