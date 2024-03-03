import express from 'express';
const router = express.Router();
import pkg from 'jsonwebtoken';
import {pool} from '../config/connect.js'
import { Stagiaire } from '../models/stagiaire.js';
function valid(obj){
    if( obj.cin == null && obj.passport == null) return false
    if (!obj.institut || !obj.id_region || !obj.filiere || !obj.tel || !obj.email || !obj.password) return false;
    if( Number(obj.id_region) < 1 ||   Number(obj.id_region) >24 ) return false;
    
    if (!/^[A-Za-z]{2,15}$/.test(obj.nom) || !/^[A-Za-z]{2,15}$/.test(obj.prenom)) return false;
    if ( !/^\d{8}$/.test(obj.tel)) return false;
    if ( !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) return false;
    return true;
}
router.post("/add", async (req,res)=>{
    try{
        let data = req.body;
        let obj = {
            'id' : null,
            'nom': data.nom,
            'prenom': data.prenom,
            'cin' : data.cin == "" || data.cin == null ? null : data.cin ,
            'passport' : data.passport == "" || data.passport == null ? null : data.passport ,
            'institut' : data.institut ,
            'id_pays' : data.id_pays,
            'id_region': data.id_region,
            'filiere': data.filiere,
            'tel': data.tel,
            'email' : data.email,
            'password': data.password
        }
        if(valid(obj)){
            obj.filiere = obj.filiere.replaceAll("'","\\'");
            obj.institut = obj.institut.replaceAll("'","\\'"); 
            let stagiaire = await pool.query(`select * from stagiaire where email = '${obj.email}' `);
            if( stagiaire[0].length >0 ) return res.send({ type : 0 , message:'stagiaire is already has an account'});
            await pool.query(`insert into stagiaire values(  ${obj.id} , '${obj.nom}' , '${obj.prenom}' , ${obj.cin}, ${obj.passport} , ${obj.id_pays} , ${obj.id_region},'${obj.institut}', '${obj.filiere}', ${obj.tel}, '${obj.email}', '${obj.password}'  )`) ;
            res.send({ type : 1 , message: 'stagiaire added successfully' });
        }else{
            res.status(400).send('data invalid');
        }
    }catch(err){
        console.log(err)
    }
})
router.post('/login' , async(req,res)=> {
    try{
        let data = req.body;
        if( !data || !data.email || !data.password ) return res.status(400).send('data invalid');
        let user = await pool.query(`select * from stagiaire where email='${data.email}'`);
        if( user[0].length == 0 ) {
            return res.send({typeErr : 0 ,message:'email ou password est incorrect'});
        } else {
            if(user[0][0].password != data.password) return res.send({typeErr : 1 ,message:'password est incorrect'});
            let payload = {
                _id : user[0][0].id,
                usertype: 0 // 0 --> stagiaire 1->admin 2-->encadrant
            }
            let token = pkg.sign( payload , 'postetn121' );
            res.send( {"mytoken": token} );
        }
    }catch(err){
        res.send('server error');
        console.log(err);
    }
})
router.get('/getById/:id', async (req,res)=>{
    try{
        let id = req.params.id ;
        if(  !/^[0-9]+$/.test(id) ) return res.status(409).send("bad request");
        let [users,] = await pool.query(`select * from stagiaire where id = ${id}`);
        if(users.length == 0) return res.status(404).send("stagiaire not found");
        return res.send( await Stagiaire.getStagiaire( id ) ); 
        /* exemple of result 
            {
                "id": 37,
                "nom": "montassar",
                "prenom": "lounissi",
                "cin": 14523214,
                "passport": null,
                "region": {
                    "id": 6,
                    "region": "sousse"
                },
                "institut": "isi ariana",
                "filiere": "",
                "tel": 26226626,
                "email": "montassar911@gmail.com",
                "password": "montassar123"
            }
        */
    } catch(err){
        return res.send("server error");
    }
});
router.put('/editStagiaire' ,async(req,res)=>{
    try{
        let data = req.body;
        if( !data.id ) return res.status(404).send();
        let [stagiaire,] = await pool.query(`select * from stagiaire where id = ${data.id}` );
        if(!stagiaire[0]) res.status(404).send();
        if( data.cin ) {
            stagiaire[0].cin = data.cin ;
            stagiaire[0].passport = null ;
        }
        if(data.passport ){
            stagiaire[0].cin = null ;
            stagiaire[0].passport = data.passport;
        }
        if(data.nom) stagiaire[0].nom = data.nom;
        if(data.prenom) stagiaire[0].prenom = data.prenom;
        if(data.email) {
            let [ser,] = await pool.query(`select * from stagiaire where email ='${data.email}' `);
            if(ser[0]) return res.send({status:false,message:'Adresse email est déjà existe'})
            stagiaire[0].email = data.email;
        }
        if(data.tel) stagiaire[0].tel = data.tel;
        if(data.institut) stagiaire[0].institut = data.institut;
        if(data.id_region) stagiaire[0].id_region = data.id_region;
        if(data.filiere) stagiaire[0].filiere = data.filiere;
        if(data.currPass && data.newPass){
            if( stagiaire[0].password != data.currPass ) return res.send({status:false,message:'Le mot de passe courant est incorrecte'})
            stagiaire[0].password = data.newPass;
        }
        stagiaire[0].filiere = stagiaire[0].filiere.replaceAll("'","\\'");
        stagiaire[0].institut = stagiaire[0].institut.replaceAll("'","\\'"); 
        await pool.query(`
            update stagiaire
            set 
            nom = '${stagiaire[0].nom}' , 
            prenom = '${stagiaire[0].prenom}' ,
            email = '${stagiaire[0].email}' ,
            cin = ${stagiaire[0].cin} ,
            passport = ${stagiaire[0].passport} ,
            institut = '${stagiaire[0].institut}' ,
            id_region = '${stagiaire[0].id_region}' ,
            filiere = '${stagiaire[0].filiere}' ,
            tel = ${stagiaire[0].tel} ,
            password = '${stagiaire[0].password}' 
            where id = ${stagiaire[0].id}
        `)
        res.send({status : true})
    }catch(err){
        console.log(err);
    }
})

export { router };