'use strict'

const User      = require('../models/user');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const error_types = require('./error_types');

let controller = {
    /*
    Podríamos haber realizado el registro pasando por el middleware de passport, pero no es necesario,
    en este caso se realiza contra una base de datos asi que es muy sencillo hacerlo nosotros.
    */
    register: (req, res, next) => {
        console.log("caso register");
        User.findOne({ username: req.body.username })
        .then(data => { //si la consulta se ejecuta
            if (data) { //si el usuario existe
                throw new error_types.InfoError("user already exists");
            }
            else { //si no existe el usuario se crea/registra
                console.log("creando usuario");
                var hash = bcrypt.hashSync(req.body.password, parseInt(process.env.BCRYPT_ROUNDS));
                let document = new User({
                    username: req.body.username,
                    first_name: req.body.first_name || '',
                    last_name: req.body.last_name || '',
                    email: req.body.email || '',
                    password: hash,
                    login_count: 0
                });
                return document.save();
            }
        })
        .then(data => { //usuario registrado con exito, pasamos al siguiente manejador
            res.json({ data: data });
        })
        .catch(err => { //error en registro, lo pasamos al manejador de errores
            next(err);
        })
    },
    login: (req, res, next) => {
        console.log("caso login");
        var params = req.body;
        var username = params.username;
        var password = params.password;
        User.findOne({username: username})
        .then(user=>{
            if(user === null || !bcrypt.compareSync(password, user.password)) 
                next(new error_types.Error404("username or password not correct."));
            else{
                console.log("*** comienza generacion token*****");
                const payload = {
                    sub: user._id,
                    exp: Math.round(Date.now()/1000) + parseInt(process.env.JWT_LIFETIME),
                    username: user.username
                };
                const token = jwt.sign(JSON.stringify(payload), process.env.JWT_SECRET, {algorithm: process.env.JWT_ALGORITHM});
                res.json({ data: { token: token } });
            } 
        })
        .catch(err=>next(err)) // error en DB
    },


        


}

module.exports = controller;