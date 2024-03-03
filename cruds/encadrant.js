import express from 'express';
const router = express.Router();
import {pool} from '../config/connect.js'
import { Encadrant } from '../models/encadrant.js';
router.get("/getById/:id", async(req,res)=>{
    try{
        let id = req.params.id;
        let [result,] = await pool.query(`select * from encadrant where id = ${id}`);
        if(!result[0]) res.status(404).send('encadrant not found');
        res.send(await Encadrant.getEncadrant(id));
        /* exemple of result 
            {
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
            }
        */
    }catch(err){
        res.send();
    }
})

router.get("/getAll", async(req,res)=>{
    try{
        let [results,] = await pool.query(`select id from encadrant`);
        let encadrants = await Promise.all(
            results.map( async(result) => await Encadrant.getEncadrant(result.id)
            )
        )
        return res.send(encadrants);
        /* exemple of result
            [
                {
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
                {
                    "id": 45,
                    "poste": {
                        "id": 7,
                        "region": {
                            "id": 6,
                            "region": "sousse"
                        },
                        "nom_residence": "bureau de poste - 7013",
                        "adresse": "Aïn Ghalel"
                    },
                    "nom": "Addison",
                    "prenom": "David",
                    "tel": 23468859,
                    "email": "Addison@gmail.com",
                    "specialite": "service43"
                }
        */
    }catch(err){
        res.send();
    }
})

router.get("/getByPoste/:id", async(req,res)=>{
    try{
        let id = req.params.id;
        let [results,] = await pool.query(`select id from encadrant where id_poste = ${id} `);
        let encadrants = await Promise.all(
            results.map( async(result) => await Encadrant.getEncadrant(result.id)
            )
        )
        return res.send(encadrants);
    }catch(err){
        res.send();
    }
})


export { router };