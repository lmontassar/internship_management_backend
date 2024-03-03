import { pool } from "../config/connect.js"
class Pays{
    constructor(obj){
        this.id = obj.id;
        this.code = obj.code;
        this.name = obj.name;
    }
    static async getPays(id){
        let [res,] = await pool.query(`select * from countries where id = ${id} `)
        return new Pays(res[0]);
    }
}
export {Pays}