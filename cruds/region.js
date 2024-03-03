import express from 'express';
const router = express.Router();
import {pool} from '../config/connect.js'
import {Region} from '../models/region.js'

router.get('/getById/:id', async(req,res) => {
    try{
        let id = req.params.id
        let [result,] = await pool.query(`select * from gouvernorat where id = ${id} `);
        if(!result[0]) res.status(404).send(`poste not found`);
        res.send(new Region(result[0]));
        /* exemple of result
        {
            "id": 8,
            "region": "béja"
        }
        */
    }catch(err){
        res.send();
    }
});

router.get('/getAll', async(req,res)=>{
    try{
        let [result,] = await pool.query(`select * from gouvernorat `);
        const regions = result.map(obj => new Region(obj));
        res.send(regions);
        /* exemple of result 
        [
                {"id": 1,"region": "tunis"},
                {"id": 2,"region": "ariana"},
                {"id": 3,"region": "ben Arous"}
        ]
        */
    }catch(err){
        res.status(401).send();
    }
})


export { router };