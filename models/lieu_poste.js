import {pool} from '../config/connect.js'
import { Region } from './region.js';
class Poste{
    constructor(obj){
        this.id = obj.id
        this.region = obj.region;
        this.nom_residence = obj.nom_residence
        this.adresse = obj.adresse
    }
    static async getPoste(id){
        let [result,] = await pool.query(`
                    select *
                    from lieu_poste
                    where lieu_poste.id = ${id}
                `);
            result[0].region = await Region.getRegion(result[0].id_region);
        return new Poste(result[0]);
    }
}
export {Poste}