import router from "next/router";
import { GetServerSideProps } from "next";
import { useState } from "react";
import { Alert, Button, Checkbox, Form, Input } from "antd";
import styles from "./login.module.scss"
import signIn from "../../firebase/auth/signin";
import Head from "next/head";
import Link from "next/link";
import CookieBanner from "../../components/CookieBanner/CookieBanner";


export const getServerSideProps: GetServerSideProps = async ( ctx ) => {
  //Get the context of the request
  const { req, res } = ctx
  //Get the cookies from the current request
  const { cookies } = req
    
  //Check if the login cookie is set
  if( cookies.login ){
    //Redirect if the cookie is not set
    res.writeHead( 302, { Location: "/" } );
    res.end();
  }

  return { props: { InitialState: {} } }
}

export default function Login(){
  const [ loginFailed, setLoginFailed ] = useState( false );

  const onFinish = async ( values ) => {
    const { error } = await signIn( values.email, values.password );

    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      //console.log(result)
      return router.push( "/" )
    }
  };

  /* const googleOnline = async () => {
    const { error } = await signInWithGoogle();

    if ( error ) {
      //console.log(error);
      setLoginFailed( true );
    }else{
      setLoginFailed( false );
      //console.log(result)
      return router.push( "/" )
    }
  }; */

  const onFinishFailed = () => {
    //console.log('Failed:', errorInfo);
    setLoginFailed( true );
  };

  return(
    <div>
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            {/*eslint-disable-next-line */}
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Log in</div>
          <div className={styles.formexplanation}>Willkommen zurück. Bitte gebe unten deine Logindaten ein.</div>
          <Form
            name="basic"
            className={styles.loginform}
            initialValues={{
              remember: true
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            layout="vertical"
            onChange={() => {
              setLoginFailed( false ) 
            }}
          >
            <Form.Item
              label="E-Mail"
              name="email"
              className={styles.loginpart}
            >
              <Input className={styles.logininput} />
            </Form.Item>

            <Form.Item
              label="Passwort"
              name="password"
              className={styles.loginpart}
            >
              <Input.Password className={styles.logininput} />
            </Form.Item>

            <div className={styles.rememberrow}>
              <Checkbox name="remember">Eingeloggt bleiben</Checkbox>
              <Link href={"/forgot/password"}>Passwort vergessen</Link>
            </div>

            <Alert
              style={{ marginBottom: 20, marginTop: 20, display: ( loginFailed )? "block": "none" }}
              message="Beim Anmelden ist etwas schief gelaufen bitte versuche es noch einmal!" 
              type="error"
            />

            <Form.Item className={styles.loginbutton}>
              <Button type="primary" htmlType="submit">
                                Anmelden
              </Button>
            </Form.Item>
          </Form>

          
                    
          <div className={styles.signupnotice}>
            <div>Noch keinen Account?</div><Link className={styles.signuplink} href={"/register"}>Jetzt registrieren</Link>
          </div>
        </div>
      </div>
      <div className={styles.copyrightfooter}>© Siteware.Mail 2023</div>
    </div>
  );
}

Login.getLayout = ( page ) => {
  return(
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Siteware.Mail dein intelligenter Mail-Assistent" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/ogimage.jpg" />
        <meta property="og:url" content={`${process.env.BASEURL}`} />
        <link rel="icon" type="image/x-icon" href="small_logo.ico" />
        <title>Siteware.Mail | mail assistant</title>
      </Head>
      <main>
        {page}
        <CookieBanner />
      </main>
    </>
  );
}