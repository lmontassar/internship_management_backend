import express from 'express';
const router = express.Router();
import pkg from 'jsonwebtoken';
import {pool} from '../config/connect.js';

router.get('/getById/:id', async(req,res) => {
    try{
        let data = req.params.id;
        const [result,] = await pool.query(`select * from admin where id = ${data.id}`);
        res.send(result[0]);
    }catch(err){
        res.send(err);
    }
})

router.post('/login', async(req,res)=>{
    try{
        let data = req.body;
        if( !data.email || !data.password ) return  res.send({typeErr : 0 ,message:'email ou password est incorrect'});
        let [admin,] = await pool.query(`select * from admin where login = '${data.email}' and password = '${data.password}' `);
        if(!admin[0]) return res.send({typeErr : 0 ,message:'email ou paassword est incorrect'});
        let payload = {
            _id:admin[0].id,
            usertype: 1 // 0-->stagiaire 1-->admin 2-->encadrant
        }
        let token = pkg.sign( payload , 'postetn121' );
        return res.send( { mytoken: token } );
    }catch(err){
        console.log(err);
        return res.send();
    }
})

/*
router.get('/faker',async(req,res)=>{
    try{
            let names = [   'Liam', 'Emma', 'Noah', 'Olivia', 'Sophia', 'Jackson', 'Ava', 'Lucas', 'Mia', 'Aiden', 'Isabella', 'Ethan', 'Harper', 'Elijah',
                        'Amelia', 'Oliver', 'Abigail', 'Benjamin', 'Charlotte', 'Caleb', 'Scarlett', 'Henry', 'Grace', 'Samuel', 'Avery', 'Alexander', 'Ella',
                        'James', 'Lily', 'Daniel', 'Chloe', 'Michael', 'Emily', 'William', 'Madison', 'Benjamin', 'Sofia', 'Logan', 'Avery', 'Mia', 'Harper',
                        'Evelyn', 'Oliver', 'Addison', 'Sebastian', 'Aubrey', 'Mateo', 'Lillian', 'Lucas', 'Zoey', 'Ethan', 'Scarlett', 'Mason', 'Aria', 'Noah',
                        'Leah', 'Jackson', 'Aurora', 'Emily', 'Ellie', 'Caleb','Hannah', 'Wyatt', 'Layla', 'Jack', 'Victoria', 'Jayden', 'Penelope', 'Owen',
                        'Stella', 'Luke', 'Hazel', 'Daniel', 'Aurora', 'Matthew', 'Natalie', 'Isaac', 'Skylar', 'Joseph', 'Zoey', 'David', 'Lyla', 'Carter', 
                        'Aurora', 'Owen', 'Nora', 'Gabriel', 'Scarlett', 'Samuel', 'Lucy', 'Anthony', 'Elizabeth', 'Grayson', 'Paisley', 'Julian', 'Hailey', 
                        'Levi', 'Bella', 'Christopher', 'Aaliya'
                    ];
            
            for(let i=25;i<100;i++){
                let x = 0 ;
                do{
                    x = Math.floor( Math.random() * 100 );
                }while( x == i );
                let y = Math.floor(Math.random() * 14 ) +1
                let number = Math.floor(Math.random() * 10000000) + 20000000;
                console.log(`insert into encadrant values(null, ${y} ,'${names[i]}' ,'${names[x]}' , ${number} , '${names[i]}@gmail.com' , 'service${i}' ) `)
                await pool.query(`insert into encadrant values(null, ${y} ,'${names[i]}' ,'${names[x]}' , ${number} , '${names[i]}@gmail.com' , 'service${i}' ) `);
            }

    }catch(err){

    }
});
*/

router.get('/getAllPays' , async(req,res)=>{
    try{
        let [results,] = await pool.query('select * from countries');
        return res.send(results);
    }catch{
        return res.status(401).send()
    }
})

router.get('/getAllType', async(req,res)=>{
    try{
        let [result,] = await pool.query('select * from type_stage');
        return res.send(result);
    }catch{
        return res.status(401).send();
    }
})
export { router };