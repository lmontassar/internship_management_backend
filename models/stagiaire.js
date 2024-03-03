import {pool} from '../config/connect.js';
import { Pays } from './pays.js';
import { Region } from './region.js';
class Stagiaire {
    constructor(obj) {
        this.id = obj.id;
        this.nom = obj.nom;
        this.prenom = obj.prenom;
        this.nationalite = obj.nationalite
        this.cin = obj.cin;
        this.passport = obj.passport;
        this.region = obj.region; // type region
        this.institut = obj.institut;
        this.filiere = obj.filiere;
        this.tel = obj.tel;
        this.email = obj.email;
        this.password = obj.password;
    }
    static async getStagiaire(id){
        let [user,] = await pool.query(`select * from stagiaire where id = ${id}`);
        user[0].region = await Region.getRegion(user[0].id_region);
        user[0].nationalite = await Pays.getPays(user[0].id_pays);
        
        return new Stagiaire(user[0]);
    }
}
export {Stagiaire}