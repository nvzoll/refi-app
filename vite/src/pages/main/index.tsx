import { projectIdAtom } from "@/atoms/firestore";
import { actionAddPathExpander } from "@/atoms/firestore.action";
import { store } from "@/atoms/store";
import { notifyErrorPromise } from "@/atoms/ui.action";
import DataSubscriber from "@/components/DataSubscriber";
import NavBar from "@/components/NavBar";
import ProductBar from "@/components/ProductBar";
import Property from "@/components/Property";
import QuoteLoading from "@/components/QuoteLoading";
import TreeView from "@/components/TreeView";
import URLSynchronizer from "@/components/URLSynchronizer";
import React, { ReactElement, useEffect, useState } from "react";
import RGL, { WidthProvider } from "react-grid-layout";
import { useHistory, useParams } from "react-router-dom";
import AutoSizer from "react-virtualized-auto-sizer";
import Background from "../background";
import UniversalHotKey from "../hotkey";
import Main from "./main";

const ReactGridLayout = WidthProvider(RGL);

const BASE_HEIGHT = 32;
const BASE_SPACE = 16;

const buildLayout = (height: number) => {
  const panelTop = BASE_SPACE + BASE_HEIGHT + BASE_SPACE;
  const panelHeight = height - panelTop - BASE_SPACE;
  // react-grid-layout: h rows span h * rowHeight + (h - 1) * margin px.
  const panelRows = (panelHeight + BASE_SPACE) / (BASE_HEIGHT + BASE_SPACE);

  return [
    { i: "nav-bar", x: 0, y: 0, w: 12, h: 1 },
    { i: "sidebar", x: 0, y: 1, w: 2, h: panelRows },
    { i: "main", x: 2, y: 1, w: 7, h: panelRows },
    { i: "property", x: 10, y: 1, w: 3, h: panelRows },
  ];
};

function MainLayout(): ReactElement {
  const history = useHistory();
  const { projectId } = useParams() as any;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    store.set(projectIdAtom, projectId);
    window
      .send("fs.init", { projectId })
      .then((response: string[]) => {
        console.log("Inited fs");
        actionAddPathExpander(response);
        window.api.renameTab(projectId);
      })
      .catch((error) => {
        history.replace({
          pathname: `/`,
          hash: "/",
        });
        notifyErrorPromise(error);
      });
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-white dark:bg-gray-800 dark:text-gray-200">
      {showLoading ? (
        <QuoteLoading onDone={() => setShowLoading(false)} />
      ) : (
        <>
          <div className="flex-1 min-h-0">
            <UniversalHotKey />
            <DataSubscriber />
            <URLSynchronizer />
            <AutoSizer disableWidth>
              {({ height }) => (
                <ReactGridLayout
                  className="transition-none layout"
                  layout={buildLayout(height)}
                  cols={12}
                  rowHeight={BASE_HEIGHT}
                  autoSize={true}
                  margin={[BASE_SPACE, BASE_SPACE]}
                  isDraggable={false}
                  isResizable={false}
                >
                  <div key="nav-bar" className="z-30">
                    <NavBar />
                  </div>
                  <div key="sidebar">
                    <TreeView />
                  </div>
                  <div key="main">
                    <Main />
                  </div>
                  <div key="property">
                    <Property />
                  </div>
                </ReactGridLayout>
              )}
            </AutoSizer>
            <Background />
          </div>
          <div className="flex flex-row justify-end pr-3 text-white bg-gray-400 dark:bg-gray-900">
            <ProductBar />
          </div>
        </>
      )}
    </div>
  );
}

export default MainLayout;
