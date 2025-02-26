import { Button, Drawer, List, message, Modal, notification, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../lib/components/context/AuthContext";
import { GetServerSideProps } from "next";
import { getAllDocs } from "../../lib/firebase/data/getData";
import Assistant, { AssistantType, InputBlock } from "../../lib/firebase/types/Assistant";
import SidebarLayout from "../../lib/components/Sidebar/SidebarLayout";
import styles from "./assistant.module.scss";
import axios from "axios";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../db";
import QaAAssistant from "../../lib/components/Assistants/QaAAssistant/QaAAssistant";
import ChatAssistant, { MsgType } from "../../lib/components/Assistants/ChatAssistant/ChatAssistant";
import { CloseOutlined, EyeOutlined } from "@ant-design/icons";
import { checkValidityOfAssistantConfig } from "../../lib/helper/assistant";

// Defines the max amount of history states saved per user
export const MAXHISTITEMS = 10;

// Defines how long antd messages will be visible
export const MSGDURATION = 3;

const { Paragraph } = Typography;



export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const assistantId = ctx.query.aid;

  if(assistantId){
    const assistantDocsQuery = await getAllDocs("Assistants");

    if(assistantDocsQuery.result){
      const assistantDocs: Array<Assistant> = assistantDocsQuery.result;

      const assistantIndex = assistantDocs.findIndex((value) => {
        return value.uid == assistantId;
      })

      if(assistantIndex != -1){
        const assistant = assistantDocs[assistantIndex];

        const valid = checkValidityOfAssistantConfig(assistant.blocks);

        if(valid){
          return {
            props: {
              assistant: assistant
            }
          }
        }else{
          return {
            redirect: {
              destination: "/",
              permanent: false
            }
          }
        }
      }else{
        return { props: {}, redirect: { destination: "/" } };
      }
    }else{
      return { props: {}, redirect: { destination: "/" } };
    }
  }else{
    return { props: {}, redirect: { destination: "/" } };
  }
}


export default function Assistant(props: { assistant: Assistant }) {
  const context = useAuthContext();
  const { user } = context;

  const [ quotaOverused, setQuotaOverused ] =  useState( false );
  const [ formDisabled] = useState( false );
  const [messageApi, contextHolder] = message.useMessage();
  const [ historyState, setHistoryState ] = useState([]);
  const [ histOpen, setHistOpen ] = useState(false);
  const [ histloading, setHistloading ] = useState(false);
  const [notificationAPI, notificationContextHolder] = notification.useNotification();
  const [ prefState, setPrefState ] = useState([]);
  const [ prefStateIdx, setPrefStateIdx ] = useState(-1);
  const [isChatbotScriptModalOpen, setChatbotScriptModalOpen] = useState(false);


  useEffect( () => {
    // Async function to init the usage of the company
    const createData = async () => {
      // Reset the overused state
      setQuotaOverused( false );
      // Call firebase to update the company with the initial token count
      await updateDoc( doc( db, "Company", user.Company ), { tokens: 0 } );
    }

    // If the company tokens are defined
    if( context.company.tokens != undefined ){
      // If the company tokens are greater as 0 or the company has unlimited token access
      if( context.company.tokens > 0 || context.company.unlimited ){
        // Reset the overused state
        setQuotaOverused( false );
      }else{
        // Otherwise the token are less than or equal than zero and we can show the user that they overused their quota
        setQuotaOverused( true );
      }
    }else{
      // If no quota is defined, create it.
      createData();
    }

  }, [context.company, context.user.Company, quotaOverused] );


  /**
   * Effect for decrypting the assistant history
   */
  useEffect( () => {
    // Async function to ask the api for decryption
    const decryptHistoy = async () => {
      // Init the history array
      let parsed = [];

      try{
        // Call the decryption api endpoint
        const decRequest = await axios.post( "/api/prompt/decrypt", {
          ciphertext: context.user.history[props.assistant.uid],
          salt: user.salt
        } )

        // Get the decrypted text from the api call
        const decryptedText = decRequest.data.message;
        // Parse the decrypted text as string array using the JSON parser
        parsed = JSON.parse( decryptedText ) as Array<string>;
      }catch( e ){
        console.log(e);
      }

      setHistoryState(parsed);
    }

    decryptHistoy();
    // eslint-disable-next-line
  }, [] );


  const updateHist = async () => {
    try{
      const encHistObj = await axios.post( "/api/prompt/encrypt", {
        content: JSON.stringify(historyState),
        salt: context.user.salt
      } );

      const encHist = encHistObj.data.message;

      // Check if the user previously had a history
      if(context.user.history){
        // If so get the history
        const userhist = context.user.history;
        // Set the history to the encoded string and update the user
        userhist[props.assistant.uid] = encHist;
        await updateDoc( doc( db, "User", context.login.uid ), { history: userhist } );
      }else{
        // If the user previously didn't have a history
        // Init the history
        const hist = {};
        // Update the history state of the assistant and update the user
        const encHist = encHistObj.data.message;
        hist[props.assistant.uid] = encHist;
        await updateDoc( doc( db, "User", context.login.uid ), { history: hist } );
      }
    }catch(e){
      console.log(e);
    }
  }

  const HistoryCard = () => {
    if(historyState.length > 0){
      if((props.assistant.blocks[0] as InputBlock).type == AssistantType.QAA){
        return(
          <List
            bordered
            loading={histloading}
            dataSource={historyState}
            locale={{ emptyText: "Noch keine Anfragen" }}
            renderItem={(item: { content: string, time: string, tokens: string }, id) => {
              return(<List.Item>
                <div className={styles.singlehistitem}>
                  <Paragraph className={styles.histitem}>{item.content.slice(0, 100)}...</Paragraph>
                  <div className={styles.subcontent}>
                    <span>{item.time}</span>
                    <span>{(typeof item.tokens == "string")? item.tokens: 0}</span>
                    <Button icon={<EyeOutlined />} onClick={() => {
                      console.log(item.content);
                      setHistOpen(false);
                      setPrefState([item.content]);
                      setPrefStateIdx(id);
                    }}></Button>
                    <Button icon={<CloseOutlined />} onClick={async () => {
                      setHistloading(true);
                      const locHistState= historyState;
                      locHistState.splice(id, 1);
                      setHistoryState(locHistState);

                      await updateHist();

                      setHistloading(false);
                    }}></Button>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
        );
      }else if((props.assistant.blocks[0] as InputBlock).type == AssistantType.CHAT){
        console.log(historyState);
        return(
          <List
            bordered
            loading={histloading}
            dataSource={historyState}
            locale={{ emptyText: "Noch keine Anfragen" }}
            renderItem={(item: { content: Array<{content: string, type: MsgType}>, time: string }, id) => {
              return(<List.Item>
                <div className={styles.singlehistitem}>
                  <Paragraph className={styles.histitem}>
                    {(item.content.length > 1)? item.content[1].content.slice(0, 100): item.content[0].content.slice(0, 100)}...
                  </Paragraph>
                  <div className={styles.subcontent}>
                    <span>{item.time}</span>
                    <Button icon={<EyeOutlined />} onClick={() => {
                      setHistOpen(false);
                      setPrefState(item.content);
                      setPrefStateIdx(id);
                    }}></Button>
                    <Button icon={<CloseOutlined />} onClick={async () => {
                      setHistloading(true);
                      const locHistState= historyState;
                      locHistState.splice(id, 1);
                      setHistoryState(locHistState);

                      await updateHist();

                      setHistloading(false);
                    }}></Button>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
        );
      }else{
        console.log((props.assistant.blocks[0] as InputBlock).type);
      }
    }else{
      return (<div className={styles.emptyhistory}>
        <h3>Noch keine Anfragen</h3>
      </div>);
    }
  }

  
  const getAssistantForm = () => {
    console.log((props.assistant.blocks[0] as InputBlock).type);

    switch ((props.assistant.blocks[0] as InputBlock).type){
    case AssistantType.QAA:
      return <QaAAssistant
        assistant={props.assistant} 
        context={context} 
        quotaOverused={quotaOverused} 
        formDisabled={formDisabled} 
        setHistoryOpen={setHistOpen} 
        messageApi={messageApi}
        notificationApi={notificationAPI}
        history={{ state: historyState, set: setHistoryState }}
        predefinedState={{ state: prefState, idx: prefStateIdx }}
      />;
    case AssistantType.CHAT:
      return <ChatAssistant
        assistant={props.assistant}
        context={context}
        quotaOverused={quotaOverused}
        formDisabled={formDisabled}
        setHistoryOpen={setHistOpen}
        messageApi={messageApi}
        notificationApi={notificationAPI}
        history={{ state: historyState, set: setHistoryState }}
        predefinedState={{ state: prefState, idx: prefStateIdx }}
      />;
    }
  }

  const getPrimaryColor = () => {
    if(props.assistant.primaryColor){
      return props.assistant.primaryColor;
    }else{
      return "#0f4faa";
    }
  }

  const getTextColor = () => {
    if(props.assistant.primaryColor){
      const c = props.assistant.primaryColor.substring(1);      // strip #
      const rgb = parseInt(c, 16);   // convert rrggbb to decimal
      const r = (rgb >> 16) & 0xff;  // extract red
      const g = (rgb >>  8) & 0xff;  // extract green
      const b = (rgb >>  0) & 0xff;  // extract blue

      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

      if (luma <= 220) {
        return "white";
      }else{
        return "black";
      }


    }else{
      return "white";
    }
  }

  const getScriptTag =  () => {
    return `<script src="${location.origin}/api/chatbot?agentid=${props.assistant.uid}&apiKey=${user.apikey}" data-nscript="afterInteractive"></script>`
  }

  const copyScript = () => {
    navigator.clipboard.writeText( getScriptTag() );
    messageApi.success( "Script in die Zwischenablage kopiert." );
  }

  return(
    <SidebarLayout context={context} hist={setHistOpen}>
      {contextHolder}
      {notificationContextHolder}
      <div className={styles.main}>
        {getAssistantForm()}
        { !!(user && user.apikey) && <div className="align-center">
          <Button
            className={styles.inputformbutton}
            type={"primary"}
            onClick={()=>setChatbotScriptModalOpen(true)}
            style={{ backgroundColor: getPrimaryColor(), color: getTextColor() }}
          >
            Chatbot einbetten
          </Button>
        </div>}
      </div>
      <Modal 
        centered width={"25%"} title={null} 
        closeIcon={null}
        open={isChatbotScriptModalOpen} footer={null} onCancel={() => setChatbotScriptModalOpen(false)}>
        <div className="chatbot-script-content">
          { getScriptTag() }
        </div>
        <div className="align-center">
          <div className="p-5">
            <Button
              onClick={()=> copyScript()}
              className={styles.inputformbutton}
              type={"primary"}
              style={{ backgroundColor: getPrimaryColor(), color: getTextColor() }}
            >
              Einbettungscode kopieren
            </Button>
          </div>
        </div>
      </Modal>
      <Drawer
        title={`Bisherige Anfragen ${historyState.length}/${MAXHISTITEMS}`}
        placement={"right"}
        closable={true}
        onClose={() => {
          setHistOpen(false)
        }}
        open={histOpen}
      >
        <HistoryCard />
      </Drawer>
    </SidebarLayout>
  );
}
