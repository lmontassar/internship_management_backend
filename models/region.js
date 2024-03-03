import {pool} from '../config/connect.js'
class Region{
    constructor(obj){
        this.id = obj.id;
        this.region = obj.region; 
    }
    static async getRegion(id){
        let [result,] = await pool.query(`select * from gouvernorat where id = ${id} `);
        return new Region(result[0]);
    }
}
export {Region}