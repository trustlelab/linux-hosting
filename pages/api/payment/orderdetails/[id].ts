import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "../../../../firebase/admin";
import axios from "axios";

type ResponseData = {
    errorcode: number,
    message: string,
}


export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  if( req.cookies.token ){
    const token = await auth.verifyIdToken( req.cookies.token );
        

    if( req.method == "GET" ){
            
      if( token ){
        const { id } = req.query;
        //console.log(req.query);
                
        if( id ){

          try{
            try{
              const data = await axios.get( `${process.env.PAYPALURL}/v2/checkout/orders/${id}`, {
                headers: {
                  "Accept": "application/json",
                  "Accept-Language": "en_US",
                  "content-type": "application/json"
                },
                auth: {
                  username: process.env.PAYPALID,
                  password: process.env.PAYPALSECRET
                }
              } );
                          
              if( data.data ){
                return res.status( 200 ).send( { errorcode: 0, message: data.data } );
              }else{
                return res.status( 200 ).send( { errorcode: 4, message: "Something went wrong" } );
              }
                          
                          
            }catch( E ){
              //console.log(E.response.data);
              return res.status( 400 ).send( { errorcode: -4, message: "Error" } );
            }
          }catch( conversionerror ){
            //console.log(conversionerror.response.data);
            return res.status( 400 ).send( { errorcode: -2, message: "Error" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 3, message: "Data required!" } );
        }

      }else{
        return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
    }
  }
}
