import type { NextApiRequest, NextApiResponse } from "next";
import { auth, firestore } from "../../../../lib/firebase/admin"
import { User } from "../../../../lib/firebase/types/User";
import { Role } from "../../../../lib/firebase/types/Role";

type ResponseData = {
    errorcode: number,
    message: string,
}

function dec2hex (dec) {
  return dec.toString(16).padStart(2, "0")
}


const TOKENLENGTH = 128;

/**
 * Create an invitation and send it to the given mail
 * @param req Request object
 * @param res Response object
 */
export default async function handler( req: NextApiRequest, res: NextApiResponse<ResponseData> ) {
  const token = await auth.verifyIdToken( req.cookies.token );

  // Check if the request was sent using POST
  if( req.method == "POST" ){
    // Validate the token
    if( token ){
      // Get the userid from the token
      const userid = token.uid;
      // Query the database for the user representation
      const userReq = await firestore.doc(`/User/${userid}`).get();
      const userData: User = userReq.data() as User;

      // Check if the user queried by the database is valid
      if(userData){
        // Query for the users role representation
        const roleReq = await firestore.doc(`/Role/${userData.Role}`).get();
        const roleData: Role = roleReq.data() as Role;

        // If the found role is valid
        if(roleData){
          // Check if the user is allowed to edit company data, otherwise block the request

          if(roleData.canEditCompanyDetails) {
            // Query the data of the company from the database
            //const companyReq = await firestore.doc(`/User/${userData.Company}`).get();
            //const companyData = companyReq.data();

            // Check if the found database is valid
            //if (companyData) {
            // Generate an array with random bytes
            const tokenArray = new Uint8Array(TOKENLENGTH / 2);
            crypto.getRandomValues(tokenArray);

            // Convert the random bytes to string
            const hexString = Array.from(tokenArray, dec2hex).join("");

            try{
              // Save the generated random string token to the company
              await firestore.doc(`/User/${userid}`).update({ apikey: hexString });
            }catch (e){
              console.error(e);
              return res.status(400).send({ errorcode: 7, message: "Error saving key to company!" });
            }
            //} else {
            //  return res.status(400).send({ errorcode: 6, message: "Company not found!" });
            //}
          }else{
            return res.status( 400 ).send( { errorcode: 5, message: "Role not defined" } );
          }
        }else{
          return res.status( 400 ).send( { errorcode: 4, message: "Operation not allowed!" } );
        }
      }else{
        return res.status( 400 ).send( { errorcode: 3, message: "User not found" } );
      }
    }else{
      return res.status( 400 ).send( { errorcode: 2, message: "Authentication required!" } );
    }
  }else{
    return res.status( 400 ).send( { errorcode: 1, message: "The request method is forbidden!" } );
  }
}
