import { Card, Button, Form, Input, Select, Result, Skeleton, Typography, Alert, Divider, message } from 'antd';
import Icon from '@ant-design/icons';
import styles from './index.module.scss'
import { db } from '../../db';
import axios, { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import SidebarLayout from '../../components/Sidebar/SidebarLayout';
import { useAuthContext } from '../../components/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Usage } from '../../firebase/types/Company';
import { Profile } from '../../firebase/types/Profile';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { handleEmptyString } from '../../helper/architecture';
import ArrowRight from '../../public/icons/arrowright.svg';
import Info from '../../public/icons/info.svg';
import Clipboard from '../../public/icons/clipboard.svg';
import cookieCutter from 'cookie-cutter'
const { Paragraph } = Typography;
const { TextArea } = Input;

const axiosTime = require('axios-time');

axiosTime(axios);


export interface InitialProps {
  Data: {
    currentMonth: number,
    currentYear: number,
  };
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  //Get the context of the request
  const { req, res } = ctx;
  //Get the cookies from the current request
  const { cookies } = req;

  let datum = new Date();

  return {
    props: {
        Data: {
          currentMonth: datum.getMonth() + 1,
          currentYear: datum.getFullYear(),
        }
    },
  };

  
};


export default function Dialogue(props: InitialProps) {
  const { login, user, company, role, quota } = useAuthContext();
  const [ form ] = Form.useForm();
  const [ showAnswer, setShowAnswer ] = useState(false);
  const [ isAnswerVisible, setIsAnswerVisible ] = useState(false);
  const [ isLoaderVisible, setIsLoaderVisible ] = useState(false);
  const [ isAnswerCardVisible, setIsAnswerCardvisible ] = useState(false);
  const [ answer, setAnswer ] = useState("");
  const [ formDisabled, setFormDisabled ] = useState(false);
  const [ quotaOverused, setQuotaOverused ] =  useState(!false);
  const [messageApi, contextHolder] = message.useMessage();
  const [ tokens, setTokens ] = useState("");
  const [ promptError, setPromptError ] = useState(false);
  
  const router = useRouter();

  const lengths = [
    "So kurz wie möglich",
    "Sehr kurz",
    "Kurz",
    "Mittellang",
    "Detailliert",
    "Umfangreich und sehr detailliert"
  ];

  const motive = [
    "Diplomatisch",
    "Respektvoll",
    "Kultiviert",
    "Bedächtig",
    "Persönlich",
    "Umgangssprachlich",
    "Unkonventionell",
    "Emphatisch"
  ];

  useEffect(() => {
    let cookiedata = cookieCutter.get('mailbuddy-dialog-lastusage');

    if(cookiedata){
      try{
        let cookieobj = JSON.parse(
          atob(cookiedata)
        );

        form.setFieldValue('profile', cookieobj.profile);
        form.setFieldValue('dialog', cookieobj.dialog);
        form.setFieldValue('continue', cookieobj.continue);
        form.setFieldValue('address', cookieobj.address);
        form.setFieldValue('order', cookieobj.order);
        form.setFieldValue('length', cookieobj.length);
      }catch(e){
        console.log(e);
      }
      
    }
  }, []);

  useEffect(() => {
    console.log(user);
  }, [company])

  useEffect(() => {

    const createData = async () => {
      await updateDoc(doc(db, "Company", user.Company), { Usage: arrayUnion({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: 0 }) });
    }

    let currentUsage = company.Usage.find((Usge: Usage) => {
      return Usge.month == props.Data.currentMonth && Usge.year == props.Data.currentYear;
    });

    if(currentUsage){
      if(currentUsage.amount > quota.tokens){
        setQuotaOverused(true);
      }else{
        setQuotaOverused(false);
      }
    }else{
      console.log("no usage")
      createData();
    }

    if (login == null) router.push("/login");
      
  }, [login]);


  const listToOptions = (liste: Array<string>) => {
    const arr = liste.map(element => {
      return {
        value: element.toLowerCase(),
        label: element
      };
    });
  
    return arr;
  }

  const generateAnswer = async (values: any) => {
    let profile = user.profiles.find((singleProfile: Profile) => {
      return singleProfile.name == values.profile;
    });

    if(profile) {
      try{
        setFormDisabled(true);
        setIsAnswerCardvisible(true);
        setIsLoaderVisible(true);
        setShowAnswer(true);
        setIsAnswerVisible(false);
        setPromptError(false);
        setTokens("");

        let cookieobject = {
          profile: values.profile,
          dialog: values.dialog,
          continue: values.continue,
          address: values.address,
          order: values.order,
          length: values.length
        }

        cookieCutter.set('mailbuddy-dialog-lastusage', btoa(JSON.stringify( cookieobject )));
  
        let answer: AxiosResponse<any, any> & {timings: {elapsedTime: Number, timingEnd: Number, timingStart: Number}} = await axios.post('/api/prompt/dialog/generate', {
          personal: profile.settings.personal,
          dialog: values.dialog,
          continue: values.continue,
          address: values.address,
          style: profile.settings.stil,
          order: values.order,
          emotions: profile.settings.emotions,
          length: values.length
        });

        if(answer.data){
          setIsLoaderVisible(false);
          setIsAnswerVisible(true);
          setAnswer(answer.data.message);
          setTokens(answer.data.tokens);

          try{
            await axios.post("/api/stats", {tokens: answer.data.tokens, time: answer.timings.elapsedTime, type: "DIALOG"});
          }catch(e){
            console.log(e);
            console.log("Timing logging failed!");
            console.log(`{tokens: ${answer.data.tokens}, time: ${answer.timings.elapsedTime}, type: "DIALOG"}`)
          }
  
          let usageidx = company.Usage.findIndex((val) => {return val.month == props.Data.currentMonth && val.year == props.Data.currentYear});
          
          if(usageidx != -1){
            let usageupdates = company.Usage;
            usageupdates[usageidx].amount += answer.data.tokens;
            await updateDoc(doc(db, "Company", user.Company), { Usage: usageupdates});

            if(usageupdates[usageidx].amount > quota.tokens){
              setQuotaOverused(true);
            }
          }else{
            let usageupdates = [];
            usageupdates.push({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: answer.data.tokens });
            await updateDoc(doc(db, "Company", user.Company), { Usage: usageupdates});
          }

          let userusageidx = user.usedCredits.findIndex((val) => {return val.month == props.Data.currentMonth && val.year == props.Data.currentYear});
          if(userusageidx != -1){
            let usageupdates = user.usedCredits;
            usageupdates[userusageidx].amount += answer.data.tokens;
            await updateDoc(doc(db, "User", login.uid), { usedCredits: usageupdates});
          }else{
            let usageupdates = [];
            usageupdates.push({ month: props.Data.currentMonth, year: props.Data.currentYear, amount: answer.data.tokens });
            await updateDoc(doc(db, "User", login.uid), { usedCredits: usageupdates});
          }
        }
  
      }catch(e){
        console.log(e);
        setTokens("");
        setIsLoaderVisible(false);
        setPromptError(true);
      }
  
      setFormDisabled(false);
    }
    
  }

  const getProfiles = () => {
    let profileOptions =  user.profiles.map((singleProfile: Profile, idx: number) => {
      return {
        key: idx,
        value: singleProfile.name
      }
    });

    return profileOptions;
  }

  const getPrompt = () => {
    if(user){
      if(!(user.profiles?.length > 0)){
        return (
          <Result
            title="Bitte definiere zuerst ein Profil"
            extra={
              <Button href='/profiles' type="primary" key="console">
                Profil erstellen
              </Button>
            }
          />
        );
      }else{
        return(
          <>
            <div className={styles.userinputform}>
              <Card title={"Verlauf"} headStyle={{backgroundColor: "#F9FAFB"}} className={styles.userinputcardmain}>
                <Form.Item className={styles.formpart} label={<b>Profil</b>} name="profile">
                  <Select
                    showSearch
                    placeholder="Wähle ein Profil aus"
                    optionFilterProp="children"
                    onChange={(values: any) => {console.log(values)}}
                    onSearch={() => {}}
                    options={getProfiles()}
                    disabled={formDisabled || quotaOverused}
                    className={styles.formselect}
                    size='large'
                    />
                  </Form.Item>
                  <Form.Item className={styles.formpart} label={<b>Bisheriger Dialog</b>} name="dialog">
                    <TextArea className={styles.forminput} rows={10} placeholder="Bisheriger Dialog..." disabled={formDisabled || quotaOverused}/>
                  </Form.Item>

                  <Form.Item className={styles.formpart} label={<b>Wie soll der Dialog fortgesetzt werden?</b>} name="continue">
                    <TextArea className={styles.forminput} rows={2} placeholder="Formuliere kurz, wie der Dialog fortgesetzt werden soll und was du damit erreichen willst?" disabled={formDisabled || quotaOverused}/>
                  </Form.Item>
              </Card>
              <Card title={"Einstellungen"} headStyle={{backgroundColor: "#F9FAFB"}} className={styles.userinputcardsub}>
                <Form.Item className={styles.formpart} label={<b>Ansprache</b>} name="address">
                    <Select placeholder="Bitte wähle die Form der Ansprache aus..." options={[
                        {label: "Du", value: "du", },
                        {label: "Sie", value: "sie", },
                    ]}
                    className={styles.formselect}
                    size='large'
                    />
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Einordnung des Gesprächpartners</b>} name="order">
                    <Select placeholder="Wie ordnest du deinen Gesprächpartner ein?" options={listToOptions(motive)} mode="multiple" allowClear className={styles.formselect} size='large'/>
                </Form.Item>

                <Form.Item className={styles.formpart} label={<b>Länge der Antwort</b>} name="length">
                  <Select placeholder="Wie lang soll die erzeuge Antwort sein?" options={listToOptions(lengths)} disabled={formDisabled || quotaOverused} className={styles.formselect} size='large'/>
                </Form.Item>
              </Card>
          </div>
          <div className={styles.formfootercontainer}>
            <div className={styles.generatebuttonrow}>
              <Button className={styles.submitbutton} htmlType='submit' type='primary' disabled={formDisabled || quotaOverused}>Antwort generieren <Icon component={ArrowRight} className={styles.buttonicon} viewBox='0 0 20 20'/></Button>
            </div>
            <div className={styles.tokenalert}>
              {
                (quotaOverused)? <Alert message={`Das Tokenbudget ist ausgeschöpft. Dein Budget setzt sich am 01.${props.Data.currentMonth+1}.${props.Data.currentYear} zurück. Wenn du weitere Tokens benötigen, kannst du diese in der Kontoübersicht dazubuchen.`} type="error" />: <></>
              }
            </div>
          </div>
          </>
        );
      }
    }
  }


  return (
    <>
      {contextHolder}
    <SidebarLayout capabilities={(role)? role.capabilities: {}} user={user} login={login}>
      <div className={styles.main}>
        <div className={styles.welcomemessage}>
          <h1>Willkommen zurück, {handleEmptyString(user.firstname)}</h1>
          <Divider className={styles.welcomeseperator} />
        </div>

        <div className={(!showAnswer)? styles.userinputformcontainer: styles.hiddencontainer} >
          <Form layout='vertical' onFinish={generateAnswer} onChange={() => {setIsAnswerCardvisible(false); setIsAnswerVisible(false); setIsLoaderVisible(false)}} form={form}>
            {getPrompt()}
          </Form>
        </div>
        <div className={(showAnswer)? styles.userinputformcontainer: styles.hiddencontainer} >
          <Card className={styles.answercard} title={"Antwort"} style={{ display: (isAnswerCardVisible)? 'block': 'none' }} headStyle={{backgroundColor: "#F9FAFB"}} extra={<div className={styles.clipboardextra} onClick={() => {navigator.clipboard.writeText(answer); messageApi.success("Antwort in die Zwischenablage kopiert.");}}><Icon component={Clipboard} className={styles.clipboardicon} viewBox='0 0 22 22' />In die Zwischenlage</div>}>
              {(isAnswerVisible)? <><div className={styles.answer}>{answer}</div><div className={styles.tokeninfo}><Icon component={Info} className={styles.infoicon} viewBox='0 0 22 22' /> Die Anfrage hat {tokens} Tokens verbraucht</div></>: <></>}
              {(isLoaderVisible)? <Skeleton active/>: <></>}
              {(promptError)? <Alert type='error' message="Bei der Generierung der Anfrage ist etwas schiefgelaufen. Bitte versuche es später erneut!" />: <></>}
          </Card>
          <div className={styles.formfootercontainer}>
            <div className={styles.generatebuttonrow}>
              <Button className={styles.backbutton} onClick={() => {setShowAnswer(false);}} type='primary'>Zurück <Icon component={ArrowRight} className={styles.buttonicon} viewBox='0 0 20 20'/></Button>
            </div>
          </div>
        </div>

        <style>
          {`span.ant-select-selection-placeholder{font-size: 14px !important; font-weight: normal !important}`}
        </style>
      </div>
    </SidebarLayout>
    </>
  )
}
