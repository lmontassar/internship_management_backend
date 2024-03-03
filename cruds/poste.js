import express from 'express';
const router = express.Router();
import {pool} from '../config/connect.js'
import { Poste } from '../models/lieu_poste.js';

    router.get("/getById/:id", async(req,res)=>{
        try{
            let id = req.params.id ;
            let [result,] = await pool.query(`
                    select *
                    from lieu_poste
                    where lieu_poste.id = ${id}
                `);
            if(!result[0]) res.status(404).send('bureau not found');
            
            return res.send(await Poste.getPoste(id));
            /*  exemple of result
                {
                    "id": 8,
                    "region": {
                        "id": 6,
                        "region": "sousse"
                    },
                    "nom_residence": "bureau de poste - 7012",
                    "adresse": "Bazina"
                }
            */
        } catch(err) {
            res.send()
        }
    })

    router.get("/getAll", async(req,res)=>{
        try{
            let [results,] = await pool.query(`            
                                            select id
                                            from lieu_poste
                                                `);
            let postes = await Promise.all(
                results.map( async (result) => Poste.getPoste(result.id)
                )
            );
            res.send(postes)
            /*  exemple of result
                [
                    {
                        "id": 7,
                        "region": {
                            "id": 6,
                            "region": "sousse"
                        },
                        "nom_residence": "bureau de poste - 7013",
                        "adresse": "Aïn Ghalel"
                    },
                    {
                        "id": 8,
                        "region": {
                            "id": 6,
                            "region": "sousse"
                        },
                        "nom_residence": "bureau de poste - 7012",
                        "adresse": "Bazina"
                    },
                    {
                        "id": 9,
                        "region": {
                            "id": 6,
                            "region": "sousse"
                        },
                        "nom_residence": "bureau de poste - 7014",
                        "adresse": "Rue Habib Thameur"
                    }
                ]
            */
        }catch(err){

        }
    });


export { router };