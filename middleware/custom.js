'use strict'
const User              = require('../models/user');
const jwt               = require('jsonwebtoken');
const error_types       = require('../controllers/error_types');

let middlewares = {
    
    /*
    Este middleware va *antes* de las peticiones.
    passport.authenticate de jwt por defecto añade en req.user el objeto que devolvamos desde
    el callback de verificación de la estrategia jwt.
    En nuestro caso hemos personalizado el auth_callback de authenticate y
    aunque también inyectamos ese dato en req.user, aprovechamos y personalizaremos las respuestas
    para que sean tipo json.
    */
    ensureAuthenticated: (req,res,next)=>{
        if(!req.headers.authorization){
            return next(new error_types.Error403("Missing Authorization header."));
        }
        let token = req.headers.authorization.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET, {algorithms: [process.env.JWT_ALGORITHM]}, (err,payload)=>{
            if(err){//comprueba validez, caducidad, etc.
                return next(new error_types.Error401(err.message));    
            }
            else{
                User.findOne({_id: payload.sub})
                .then(data=>{
                    if (data === null) { //no existe el usuario
                        //podríamos registrar el usuario
                        return next(new error_types.Error403("You are not allowed to access."));
                    }
                    /*encontramos el usuario así que procedemos a devolverlo para
                    inyectarlo en req.user de la petición en curso*/
                    else{
                        req.user = data;
                        next();
                    } 
                })
                .catch(err=>next(err)) //si hay un error en la consulta a db, lo devolvemos                
            }                
        });
    },

    /*
    Este middleware va al final de todos los middleware y rutas.
    middleware de manejo de errores.
    */
    errorHandler: (error, req, res, next) => {
        console.log(error)
        console.log("ejecutando middleware de control de errores");
        if(error instanceof error_types.InfoError)
            res.status(200).json({error: error.message});
        else if(error instanceof error_types.Error404)
            res.status(404).json({error: error.message});
        else if(error instanceof error_types.Error403)
            res.status(403).json({error: error.message});
        else if(error instanceof error_types.Error401)
            res.status(401).json({error: error.message});
        else if(error.name == "ValidationError") //de mongoose
            res.status(200).json({error: error.message});
        else if(error.message)
            res.status(500).json({error: error.message});
        else
            next();
    },

    /*
    Este middleware va al final de todos los middleware y rutas.
    middleware para manejar notFound
    */
    notFoundHandler: (req, res, next) => {
        console.log("ejecutando middleware para manejo de endpoints no encontrados");
        res.status(404).json({error: "endpoint not found"});
    }
}
    

module.exports = middlewares;