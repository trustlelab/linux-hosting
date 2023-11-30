import router from "next/router";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { Button, Form, Input, Select, Steps, Typography } from "antd";
import styles from "./setup.module.scss"
import { useAuthContext } from "../../components/context/AuthContext";
import updateData from "../../firebase/data/updateData";
import { listToOptions } from "../../helper/architecture";
import axios from "axios";
const { Paragraph } = Typography;
const { TextArea } = Input;


const style = [
  "Professionell",
  "Formell",
  "Sachlich",
  "Komplex",
  "Einfach",
  "Konservativ",
  "Modern",
  "Wissenschaftlich",
  "Fachspezifisch",
  "Abstrakt",
  "Klar",
  "Direkt",
  "Rhetorisch",
  "Ausdrucksstark"
];

const emotions = [
  "Humorvoll",
  "Nüchtern",
  "Sentimental",
  "Objektiv",
  "Subjektiv",
  "Ehrfürchtig",
  "Emotionell",
  "Lebhaft",
  "Freundlich",
  "Höflich",
  "Selbstbewusst",
  "Sympathisch",
  "Kreativ",
  "Enthusiastisch",
  "Eloquent",
  "Prägnant",
  "Blumig",
  "Poetisch",
  "Pathetisch",
  "Scherzhaft",
  "Mystisch",
  "Ironisch",
  "Sarkastisch",
  "Despektierlich"
];


export const getServerSideProps: GetServerSideProps = async () => {
  return { props: { InitialState: {} } }
}

export default function Setup(){
  const { login, user, role } = useAuthContext();
  const [current, setCurrent] = useState( 0 );
  const [ setupForm ] = Form.useForm();
  const [ bareMinimum, setBareMinimum ] = useState( false );

  useEffect( () => {
    // Check if the user already has profiles. In this Case the setup was not run yet;
    if( user.setupDone ){
      router.push( "/" );
    }
  }, [user.setupDone] )


  const getFormSteps = () => {        
    if( role.canSetupCompany ){
      return [
        {
          step: 0,
          title: "Erzähl mir etwas über Dich!",
          content: <div className={styles.singlestep}>
            <Paragraph>Zusätzlich benötigen wir noch Informationen über dich. Wer bist du, was treibt dich an?</Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"user"}>
                <TextArea className={styles.forminput} onChange={( value ) => {
                  setBareMinimum( value.currentTarget.value != "" )
                }} rows={10} maxLength={1200} placeholder={"Beschreibe dich und was dich auszeichnet."}></TextArea>
              </Form.Item>
            </div>
          </div>
        },
        {   step: 1,
          title: "Erzähl mir etwas über deine Firma!",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Damit wir dir das bestmögliche Nutzererlebnis bieten können, benötigen wir ein paar Infos über dich. Das hilft uns, 
                maßgeschneiderte Lösungen für dich zu erzeugen. Keine Sorge, deine Daten sind bei uns in sicheren Händen!
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name="company">
                <TextArea className={styles.forminput} rows={10} maxLength={1200} placeholder={"Beschreibe deine Firma und ihr Kerngeschäft."}></TextArea>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 2,
          title: "Wie schreibst du deine Mails?",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Wir möchten mehr über deinen Schreibstil erfahren, damit Siteware.Mail ihn perfekt imitieren kann. 
                Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if( value.length > 3 ){
                        setupForm.setFieldValue( "styles", value.slice( 0, 3 ) )
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if( value.length > 3 ){
                        setupForm.setFieldValue( "emotions", value.slice( 0, 3 ) )
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 3,
          title: "Abschließen",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Du bist jetzt startklar für Siteware.Mail! Alles, was du brauchst, ist einsatzbereit. Los geht&apos;s. 
                Erlebe eine neue Dimension der E-Mail-Kommunikation!
            </Paragraph>
          </div>
        }
      ];
    }else{
      return [
        {
          step: 0,
          title: "Erzähl mir etwas über Dich!",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Damit wir dir das bestmögliche Nutzererlebnis bieten können, benötigen wir ein paar Infos über deine Firma. 
                Das hilft uns, maßgeschneiderte Lösungen für dich zu erzeugen. Keine Sorge, deine Daten sind bei uns in sicheren Händen!
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"user"} rules={[
                {
                  required: true,
                  message: "Bitte beschreibe dich kurz!"
                }
              ]}>
                <TextArea onChange={( value ) => {
                  setBareMinimum( value.currentTarget.value != "" )
                }} className={styles.forminput} rows={10} placeholder={"Beschreibe dich und was dich auszeichnet."}></TextArea>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 1,
          title: "Wie schreibst du deine Mails?",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Wir möchten mehr über deinen Schreibstil erfahren, damit Siteware.Mail ihn perfekt imitieren kann. 
                Das hilft uns, dir eine personalisierte und natürliche Erfahrung zu bieten.
            </Paragraph>
            <div className={styles.formpart}>
              <Form.Item name={"styles"} label={"Wir würdest du den Stil deiner E-Mails beschreiben? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if( value.length > 3 ){
                        setupForm.setFieldValue( "styles", value.slice( 0, 3 ) )
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( style )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
            <div className={styles.formpart}>
              <Form.Item name={"emotions"} label={"Welche Gemütslage hast du dabei? (maximal  3)"}
                rules={[
                  () => ( {
                    validator( _, value ) {
                      if( value.length > 3 ){
                        setupForm.setFieldValue( "emotions", value.slice( 0, 3 ) )
                      }
                      return Promise.resolve();
                    }
                  } )
                ]}
              >
                <Select options={listToOptions( emotions )} className={styles.formselect} size='large' mode="multiple" allowClear/>
              </Form.Item>
            </div>
          </div>
        },
        {
          step: 2,
          title: "Abschließen",
          content: <div className={styles.singlestep}>
            <Paragraph>
                Du bist jetzt startklar für Siteware.Mail! Alles, was du brauchst, ist einsatzbereit. Los geht&apos;s. 
                Erlebe eine neue Dimension der E-Mail-Kommunikation!
            </Paragraph>
          </div>
        }
      ];
    }
  }
    
  const setupUser = async () => {
    const companyinfo = setupForm.getFieldValue( "company" );
    const userinfo = setupForm.getFieldValue( "user" );
    const userstyles = setupForm.getFieldValue( "styles" );
    const userEmotions = setupForm.getFieldValue( "emotions" );
        

    if( companyinfo ){
      await updateData( "Company", user.Company, { settings: { background: companyinfo } } );
    }

    if( userinfo ){
      let profileArr = [];
      try{
        const encreq = await axios.post( "/api/prompt/encrypt", {
          content: JSON.stringify( { name: "Hauptprofil", settings: { personal: userinfo, emotions: userEmotions, stil: userstyles } } ),
          salt: user.salt
        } );

        profileArr.push( encreq.data.message );
      }catch{
        profileArr = [];
      }

      await updateData( "User", login.uid, { profiles: profileArr, setupDone: true } );
    }

    router.push( "/" );
  }

  return(
    <div>
      <div className={styles.logincontainer}>
        <div className={styles.logorow}>
          <div className={styles.logobox}>
            <img src={"/logo.svg"} alt="Logo" width={100}/>
          </div>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formtitle}>Willkommen bei Siteware.Mail</div>
          <div className={styles.formexplanation}>Wir müssen zuerst dein Konto einrichten</div>
                    
          <div className={styles.stepcontainer}>
            <Steps className={styles.stepbanner} current={current} items={getFormSteps()} />

            <div className={styles.stepformcontent}>
              <Form form={setupForm} onFinish={setupUser} layout="vertical">
                {getFormSteps()[current].content}
              </Form>
            </div>


            <div className={styles.continue}>
              {current < getFormSteps().length - 1 && (
                <Button disabled={!bareMinimum} type="primary" onClick={() => setCurrent( current + 1 )}>
                                Weiter
                </Button>
              )}
              {current === getFormSteps().length - 1 && (
                <Button type="primary" onClick={() => setupUser()}>
                                Zu Siteware.Mail
                </Button>
              )}
              {current > 0 && (
                <Button style={{ margin: "0 8px" }} onClick={() => setCurrent( current - 1 )}>
                                Zurück
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.copyrightfooter}>© Siteware.Mail 2023</div>
    </div>
  );
}