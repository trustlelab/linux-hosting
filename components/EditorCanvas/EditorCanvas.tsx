import { ReactInfiniteCanvas, ReactInfiniteCanvasHandle } from "react-infinite-canvas";
import { useEffect, useRef, useState } from "react";
import styles from "./editorcanvas.module.scss";
import { FloatButton } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useDroppable } from "@dnd-kit/core";
import { useEditorContext } from "../EditorSidebar/EditorSidebar";
import InputEditorBlock from "../InputBlock/InputBlock";
import { AiModel, AssistantType, Block, InputBlock } from "../../firebase/types/Assistant";

export default function EditorCanvas() {
  const canvasRef = useRef<ReactInfiniteCanvasHandle>();
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable"
  });
  const { assistant, setAssistant } = useEditorContext();
  const [ buildingBricks, setBuildingBricks ] = useState<Array<Block | InputBlock>>([])



  useEffect(() => {
    if(assistant){
      setBuildingBricks(assistant.blocks);
    }
  }, [assistant]);

  useEffect(() => {
    console.log(assistant);


    if(assistant){
      const localAss = assistant;
      localAss.blocks = buildingBricks;
      setAssistant(localAss);
    }

  }, [buildingBricks]);

  return (
    <div className={styles.canvascontainer}>
      <ReactInfiniteCanvas
        ref={canvasRef}
        onCanvasMount={(mountFunc: ReactInfiniteCanvasHandle) => {
          mountFunc.fitContentToView({ scale: 2, offset: { x: 0, y: 400 } });
        }}
        panOnScroll={false}
        customComponents={[
          
        ]}
        renderScrollBar={false}
        minZoom={2}
        maxZoom={2}
      >
        {/*<div className={styles.buildingblock}>
              Neuer Block
        </div>*/}
        {/*<DragOverlay dropAnimation={{
          duration: 500,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)"
        }} modifiers={[restrictToWindowEdges]}>
          {activeId ? (
            <BuildingblockWrapper />
          ): null}
        </DragOverlay>*/}
        <div>
          {buildingBricks.map((brick, idx) => {
            if(idx == 0){
              return(<InputEditorBlock key={idx} block={brick as InputBlock} updateBlockState={() => {}}/>);
            }
          })}
          {(buildingBricks.length == 0)? <div className={styles.addBlock} onClick={() => {
            const localBricks = [];
            localBricks.push({
              name: "Neuer Block",
              prompt: "",
              personality: "",
              model: AiModel.GPT4,
              type: AssistantType.QAA,
              inputColumns: []
            });
            setBuildingBricks(localBricks);
          }}>+</div>: <></>}
        </div>
      </ReactInfiniteCanvas>
      <FloatButton.Group shape="square" style={{ right: 24 }}>
        <FloatButton icon={<HomeOutlined />} onClick={() => {
          canvasRef.current?.fitContentToView({ scale: 2 });
        }} />
      </FloatButton.Group>
    </div>
  );
}