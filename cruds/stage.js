import express from 'express';
import multer from 'multer';
import { resolve } from 'path';
const router = express.Router();
import { pool } from '../config/connect.js';
import { Stage } from '../models/stage.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path';
import fs from 'fs';
import fontkit from '@pdf-lib/fontkit'
import {PDFDocument} from 'pdf-lib'
import { readFile,writeFile } from 'fs/promises';
import NodeMailer from 'nodemailer'
import { Stagiaire } from '../models/stagiaire.js';
import dotenv from 'dotenv';
dotenv.config();

const MailConfig = {
    host: process.env.EMAIL_HOST, 
    service: process.env.EMAIL_SERVICE, 
    port: process.env.EMAIL_PORT, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    },
    name: process.env.EMAIL_NAME
};


/* Mail configuration */
const transporter = NodeMailer.createTransport({
    host: MailConfig.host,
    service: MailConfig.service,
    port: MailConfig.port,
    secure: MailConfig.port === 465,
    auth: {
        user: MailConfig.auth.user,
        pass: MailConfig.auth.pass
    }
})



function valid(obj) {
    if (obj.id_stagiaire == null || obj.date_debut == null || obj.date_fin == null || obj.id_type == null || obj.lieu_proposee == null || obj.id_fiche_reponse == null) return false;
    if (!/^[0-9]+$/.test(obj.id_stagiaire)) return false;
    if (new Date(obj.id_date_debut).toString() !== 'Invalid Date') return false;
    if (new Date(obj.id_date_fin).toString() !== 'Invalid Date') return false;
    let date_debut = new Date(obj.date_debut);
    let date_fin = new Date(obj.date_fin);
    if (date_debut >= date_fin) return false;
    return true;
}
let filename = "";
// upload pdf
const mystorage = multer.diskStorage({
    destination: "uploads/pdf",
    filename: (req, file, redirect) => {
        let date = Date.now();
        let f1 = "file" + date + '.' + file.mimetype.split('/')[1];
        redirect(null, f1);
        filename = f1;
    }
})
const upload = multer({ storage: mystorage });
router.post('/add', upload.any(), async (req, res) => {
    try {
        let filename1 = filename;
        filename = "";
        if (filename1.substring(filename1.indexOf(".") + 1) != "pdf") return res.status(400).send('failed upload pdf ');
        await pool.query(`insert into fichier values( null , '${filename1}' , 'uploads/pdf/', NOW() )`);
        let file = await pool.query(`select * from fichier where nom_fichier = '${filename1}'  `);
        if (file[0].length == 0) return res.status('400').send('failed upload file');
        let data = req.body;
        let obj = {
            "id": null,
            "id_stagiaire": data.id_stagiaire,
            "date_debut": data.date_debut,
            "date_fin": data.date_fin,
            "id_type": data.id_type,
            "id_region": data.id_region,
            "lieu_proposee": data.lieu_proposee.replaceAll("'","\\'"),
            "etat": 0,
            "id_fiche_reponse": file[0][0].id
        }
        if (valid(obj)) {
            let data = await pool.query(`select * from stagiaire where id = ${obj.id_stagiaire}`);
            if (data[0].length == 0) return res.send({ message: 'stagiaire not found!', status: false });
            await pool.query(`insert into stage values( null , ${obj.id_stagiaire} , null , null , now() , null , STR_TO_DATE('${obj.date_debut}', '%Y-%m-%d'),STR_TO_DATE('${obj.date_fin}', '%Y-%m-%d'),${obj.id_type},'${obj.lieu_proposee}',${obj.id_region},${obj.etat},${obj.id_fiche_reponse},null,null,null )`);
            let [stage,] = await pool.query(` 
                                select id
                                from stage 
                                where id_stagiaire = ${obj.id_stagiaire}
                                order by date_demande desc
                                limit 1`);

            res.status(200).send({ message: 'stage saved successuly', etat: 'true', id: stage[0].id });
        } else {
            res.status(400).send('data invalid');
        }
    } catch (err) {
        console.log(err)
        res.send('server error');
    }
});

router.put('/uploadLettreAff', upload.any(), async (req, res) => {
    try {
        let data = req.body;
        if (!data.id) return res.status(400).send('data invalid');
        let filename1 = filename;
        filename = "";
        await pool.query(`insert into fichier values( null , '${filename1}' , 'uploads/pdf/', NOW() )`);
        let [file,] = await pool.query(`select * from fichier where nom_fichier = '${filename1}'  `);
        if (file.length == 0) return res.status('400').send('failed upload file');
        let [stage,] = await pool.query(`select * from stage where id = ${data.id} `);
        if (stage.length == 0) return res.send({ message: "stage not found", etat: false });
        await pool.query(`update stage set id_lettre_affectation = ${file[0].id} , etat = 2 where id = ${data.id} `);
        return res.send({ message: "file uploaded successfuly", etat: true });
    } catch (err) {
        return res.send(err);
    }
});

router.get('/getByStagiaire/:id', async (req, res) => {
    try {
        let id = req.params.id;
        if (!/^[0-9]+$/.test(id)) return res.status(400).send('data invalid');
        let [results,] = await pool.query(`select * from stage where id_stagiaire=${id} order by date_demande desc `);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ))
        return res.send(stages);
    } catch (err) {
        console.log(err);
        res.send('server error');
    }
});

router.get('/getFile/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let [file,] = await pool.query(`select * from fichier where id = ${id}`);
        if (!file[0]) return res.status(404).send("file not found");
        let Path = resolve("uploads/pdf/" + file[0].nom_fichier);
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(Path, (err) => {
            if (err) res.status(500).send(err);
        });
    } catch (err) {
        res.send(err);
    }
});

router.get('/getpdfById/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let [file,] = await pool.query(`select * from fichier where id = ${id}`);
        if (!file[0]) return res.status(404).send("file not found");

        return res.send({ link: 'files/' + file[0].nom_fichier });
    } catch (err) {
        res.send(err);
    }
});

router.get('/GetAllDemandeInfo', async (req, res) => {
    try {
        let [results,] = await pool.query(` select s2.id
                                            from stagiaire s1 join stage s2 on ( s1.id = s2.id_stagiaire )
                                            where s2.etat in (0,2,4) or ( s2.etat = 3 and s2.date_fin < now() ) 
                                        `);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ));
        res.send(stages);
    } catch (err) {
        res.send(err);
    }
});

router.put('/Accepter1', upload.any(), async (req, res) => {
    try {
        let data = req.body;
        if (!data.id) return res.status(400).send('data invalid');
        let filename1 = filename;
        filename = "";
        await pool.query(`insert into fichier values( null , '${filename1}' , 'uploads/pdf/', NOW() )`);
        let [file,] = await pool.query(`select * from fichier where nom_fichier = '${filename1}'  `);
        if (file.length == 0) return res.status('400').send('failed upload file');
        let [stage,] = await pool.query(`select * from stage where id = ${data.id} `);
        if (stage.length == 0) return res.send({ message: "stage not found", etat: false });
        await pool.query(`update stage set id_fiche_reponse_signe = ${file[0].id} , etat = 1 , date_reponse = now() where id = ${data.id} `);
        let stagiaire = await Stagiaire.getStagiaire(stage[0].id_stagiaire);
        let Path = resolve("uploads/pdf/" + file[0].nom_fichier);
        
        res.send({ message: "file uploaded successfuly", etat: true });
        const info = await transporter.sendMail({
            from: {
                name: MailConfig.name,
                address: MailConfig.auth.user
            },
            to: stagiaire.email,
            subject: "Réponse à votre demande de stage",
            html: `
                <p>Bonjour ${stagiaire.nom},</p>
                <p>Nous sommes ravis de vous informer que votre demande de stage auprès de Poste tunisienne a été acceptée. Félicitations !</p>
                <p>Encore une fois, félicitations pour votre sélection et nous sommes impatients de travailler ensemble.</p>
                <p>Cordialement,</p>
                <p>Poste tunisienne</p>
            `,
            attachments: [
                {
                    filename: "fiche_réponse",
                    path: Path,
                    contentType: 'application/pdf'
                }
            ]
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});

router.put('/sendAttestation', upload.any(), async (req, res) => {
    try {
        let data = req.body;
        if (!data.id) return res.status(400).send('data invalid');
        let filename1 = filename;
        filename = "";
        await pool.query(`insert into fichier values( null , '${filename1}' , 'uploads/pdf/', NOW() )`);
        let [file,] = await pool.query(`select * from fichier where nom_fichier = '${filename1}'  `);
        if (file.length == 0) return res.status('400').send('failed upload file');
        let [stage,] = await pool.query(`select * from stage where id = ${data.id} `);
        if (stage.length == 0) return res.send({ message: "stage not found", etat: false });
        await pool.query(`update stage set id_attestation = ${file[0].id} , etat = 5 where id = ${data.id} `);
        let stagiaire = await Stagiaire.getStagiaire(stage[0].id_stagiaire);
        let Path = resolve("uploads/pdf/" + file[0].nom_fichier);   
        res.send({ message: "file uploaded successfuly", etat: true });
        const info = await transporter.sendMail({
            from: {
                name: MailConfig.name,
                address: MailConfig.auth.user
            },
            to: stagiaire.email,
            subject: "Attestation de stage",
            html: `
                <p>Bonjour ${stagiaire.nom},</p>
                <p>Nous tenons à vous remercier chaleureusement d'avoir complété votre stage chez Poste Tunisienne. C'est avec une grande satisfaction que nous vous délivrons cette attestation de stage, témoignage de votre engagement et de votre excellent travail tout au long de cette période.</p>
                <p>Nous sommes reconnaissants pour votre travail exceptionnel tout au long de cette période.</p>
                <p>Cordialement,</p>
                <p>Poste tunisienne</p>
            `,
            attachments: [
                {
                    filename: "fiche_réponse",
                    path: Path,
                    contentType: 'application/pdf'
                }
            ]
        });
    } catch (err) {
        res.send(err);
    }
});

router.put('/editStage', async (req, res) => {
    try {
        let data = req.body;
        if (!data.id) return res.status(404).send();
        let [stage,] = await pool.query(`select * from stage where id = ${data.id}`);
        if (data.id_Encadrant != null) stage[0].id_Encadrant = data.id_Encadrant;
        if (data.id_poste != null) stage[0].id_poste = data.id_poste;
        if (data.date_debut != null) stage[0].date_debut = data.date_debut;
        if (data.date_fin != null) stage[0].date_fin = data.date_fin;
        if (data.id_type != null) stage[0].id_type = data.id_type;
        if (data.lieu_proposee != null) stage[0].lieu_proposee = data.lieu_proposee;
        if (data.etat != null) stage[0].etat = data.etat;
        await pool.query(`  update stage
                            set id_Encadrant = ${stage[0].id_Encadrant},
                            id_poste = ${stage[0].id_poste},
                            date_debut = STR_TO_DATE('${new Date(stage[0].date_debut).toLocaleDateString('en-GB')}', '%d/%m/%Y'),
                            date_fin = STR_TO_DATE('${new Date(stage[0].date_fin).toLocaleDateString('en-GB')}', '%d/%m/%Y'),
                            id_type= ${stage[0].id_type},
                            lieu_proposee= '${stage[0].lieu_proposee.replaceAll("'","\\'")}',
                            etat = ${stage[0].etat}
                            where id = ${stage[0].id};
                        `);
        res.send({ message: "data has been successfully changed" })
    } catch (err) {
        res.status(401).send();
        console.log(err);
    }
})

router.put('/demandeAtt', async (req, res) => {
    try {
        let data = req.body;
        if (!data.id) res.status(409).send();
        let [stage,] = await pool.query(`select * from stage where id = ${data.id}`);
        if (!stage[0]) res.status(404).send();
        let currDate = new Date();
        let dateFin = new Date(stage[0].date_fin);
        if (dateFin.getTime() > currDate.getTime()) {
            res.status(400).send();
        } else {
            await pool.query(`update stage set etat = 4 where id = ${data.id}`);
            res.send({ message: 'etat changed successfuly' });
        }
    } catch (err) {
        res.send();
    }
})

router.get('/getById/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let [stage,] = await pool.query(`select * from stage where id = ${id}`);
        if (!stage[0]) return res.status(404).send();
        return res.send(await Stage.getStage(stage[0].id));
    } catch (err) {
        res.send(err);
    }
});

router.get('/getAll', async (req, res) => {
    try {
        let [results,] = await pool.query(`select id from stage`);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ));
        return res.send(stages);
    } catch (err) {
        res.status(401).send()
        console.log(err);
    }
})

router.get('/getEncours', async (req, res) => {
    try {
        let [results,] = await pool.query(`SELECT id from stage where date_debut < now() and date_fin > now() and etat =3`);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ));
        return res.send(stages);
    } catch (err) {
        console.log(err);
    }
})

router.get('/getByPoste/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let [results,] = await pool.query(`select id from stage where  id_poste = ${id} `);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ));
        return res.send(stages);
    } catch (err) {
        res.status(401).send()
        console.log(err);
    }
})

router.get('/getByEncadrants/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let [results,] = await pool.query(`select id from stage where  id_Encadrant = ${id} `);
        let stages = await Promise.all(results.map(
            async (stage) => await Stage.getStage(stage.id)
        ));
        return res.send(stages);
    } catch (err) {
        res.status(401).send()
        console.log(err);
    }
})
router.post('/generateAttestation', async(req,res)=>{
    try{
        let fn = new Date().getTime();
        let data = req.body ;
        let obj = {
            id: data.id,
            fullname : data.etudiant.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
            cin : data.cin ? data.cin : null,
            passport : data.passport ? data.passport : null,
            type : data.type,
            itablissement : data.institut ,
            date_d : new Date(data.date_debut).toLocaleDateString('en-GB'),
            date_f : new Date(data.date_fin).toLocaleDateString('en-GB'),
        }
        const pdfFilePath = path.resolve(__dirname, '../PDFMODELS',"ATTESTATION_VF.pdf");
        const pdfFilePath2 = path.resolve(__dirname, '../fortest',fn+'.pdf')
        const d = await readFile(pdfFilePath) 
        const pdf = await PDFDocument.load(d);
        const form = pdf.getForm();
        pdf.registerFontkit(fontkit);
        /*normal font*/
        const fontPath = path.resolve(__dirname, '../fortest','tnr.ttf');
        const fontBytes = fs.readFileSync(fontPath);
        const font = await pdf.embedFont(fontBytes)
        /*font bold*/
        const fontPath2 = path.resolve(__dirname, '../fortest','tnrb.ttf');
        const fontBytesBold = fs.readFileSync(fontPath2);
        const fontBold = await pdf.embedFont(fontBytesBold)

        const fields = form.getFields();
        let fieldNames = fields.map(f => f.getName())
        form.getTextField(fieldNames[4]).setText('A effectué un '+obj.type+' au sein de l’Office National des Postes, et ce : ');
        form.flatten();
        const pages = pdf.getPages();
        const page = pages[0]
        
        page.drawText(obj.id ,
            {
                x : 100,
                y : 684,
                size : 11,
                font : fontBold
            })
        page.drawText(obj.fullname ,
            {
                x : 190,
                y : 515,
                size : 15,
                font : fontBold
            })
        page.drawText(obj.cin ? ('CIN / '+ obj.cin) : ('Passeport / '+obj.passport) ,
            {
                x : 181,
                y : 485,
                size : 15,
                font : fontBold
            })
            function wrapText(text, maxWidth) {
                var words = text.split(' ');
                var lines = [];
                var currentLine = words[0];
            
                for (var i = 1; i < words.length; i++) {
                    var word = words[i];
                    var width = (currentLine.length + word.length) * 15; 
            
                    if (width < maxWidth) {
                        currentLine += ' ' + word;
                    } else {
                        lines.push(currentLine);
                        currentLine = word;
                    }
                }
                lines.push(currentLine);
            
                return lines.join('\n');
            }
        let wraptext = wrapText(obj.itablissement, 650)
        page.drawText( wraptext ,
            {
                x : 257,
                y : 456,
                size : 15,
                font : fontBold
            })
        page.drawText( obj.date_d ,
            {
                x : 260,
                y : 348,
                size : 12,
                font : fontBold
            })
        page.drawText( obj.date_f,
            {
                x : 340,
                y : 348,
                size : 12,
                font : fontBold
            })
        page.drawText( new Date().toLocaleDateString('en-GB'),
            {
                x : 110,
                y : 214,
                size : 12,
                font : fontBold
            })
        const pdfBytes = await pdf.save();
        await writeFile(pdfFilePath2,pdfBytes);
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(pdfFilePath2 ,(err)=>{
            if (err){
                fs.unlink(pdfFilePath2, (err) => {
                    if (err) {
                        console.error('Error deleting PDF:', err);
                    } else {
                        console.log('PDF deleted successfully');
                    }
                });
                return
            } else {
                fs.unlink(pdfFilePath2, (err) => {
                    if (err) {
                        console.error('Error deleting PDF:', err);
                    } else {
                        console.log('PDF deleted successfully');
                    }
                });
                return
            }
        });
    }catch(err){
        console.log(err)
        return res.send('error')
        
    }
})

router.post('/generateFicheReponse', async(req,res)=>{
    try{
        let fn = new Date().getTime();
        let data = req.body ;
        let obj = {
            id: data.id,
            n : data.n,
            fullname : 'A '+ data.etudiant.toLowerCase().split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
            lieu : data.lieu,
            date_d : new Date(data.date_debut).toLocaleDateString('en-GB'),
            date_f : new Date(data.date_fin).toLocaleDateString('en-GB'),
        }
        const pdfFilePath = path.resolve(__dirname, '../PDFMODELS',"f3.pdf");
        const pdfFilePath2 = path.resolve(__dirname, '../fortest',fn+'.pdf');
        const d = await readFile(pdfFilePath) 
        const pdf = await PDFDocument.load(d);
        const form = pdf.getForm();
        pdf.registerFontkit(fontkit);
        /*normal font*/
        const fontPath = path.resolve(__dirname, '../fortest','tnr.ttf');
        const fontBytes = fs.readFileSync(fontPath);
        const font = await pdf.embedFont(fontBytes)
        /*font bold*/
        const fontPath2 = path.resolve(__dirname, '../fortest','tnrb.ttf');
        const fontBytesBold = fs.readFileSync(fontPath2);
        const fontBold = await pdf.embedFont(fontBytesBold)
        form.flatten();
        const pages = pdf.getPages();
        const page = pages[0]
        page.drawText(obj.id ,
            {
                x : 100,
                y : 697,
                size : 11,
                font : fontBold
            })
        page.drawText( new Date().toLocaleDateString('en-GB') ,
            {
                x : 57,
                y : 680,
                size : 11,
                font : fontBold
            })
        const { width} = page.getSize();
        const textWidth = font.widthOfTextAtSize(obj.fullname, 20);
        page.drawText( obj.fullname ,
            {
                x : ( width - textWidth) / 2,
                y : 636,
                size : 20,
                font : fontBold
            })
        page.drawText( String(obj.n) ,
            {
                x : 330,
                y : 580,
                size : 16,
                font : fontBold
            })
        page.drawText( obj.date_d ,
        {
            x : 110,
            y : 434,
            size : 12,
            font : fontBold
        })
        page.drawText( obj.date_f ,
            {
                x : 215,
                y : 434,
                size : 12,
                font : fontBold
            })
        page.drawText( obj.lieu ,
            {
                x : 145,
                y : 415,
                size : 12,
                font : fontBold
            })
        const pdfBytes = await pdf.save();
        await writeFile(pdfFilePath2,pdfBytes);
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(pdfFilePath2 ,(err)=>{
            if (err){
                fs.unlink(pdfFilePath2, (err) => {
                    if (err) {
                        console.error('Error deleting PDF:', err);
                    } else {
                        console.log('PDF deleted successfully');
                    }
                });
                return
            } else {
                fs.unlink(pdfFilePath2, (err) => {
                    if (err) {
                        console.error('Error deleting PDF:', err);
                    } else {
                        console.log('PDF deleted successfully');
                    }
                });
                return
            }
        });
    }catch(err){
        console.log(err)
        return res.send('error')
        
    }
})

export { router };