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
import GridLayout from "react-grid-layout";
import { useNavigate, useParams } from "react-router-dom";
import { AutoSizer } from "react-virtualized-auto-sizer";
import Background from "../background";
import UniversalHotKey from "../hotkey";
import Main from "./main";

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
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    store.set(projectIdAtom, projectId);
    window
      .send("fs.init", { projectId })
      .then((response: string[]) => {
        console.log("Inited fs");
        actionAddPathExpander(response);
        window.api.renameTab(projectId);
      })
      .catch((error) => {
        navigate({ pathname: "/", hash: "/" }, { replace: true });
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
            <AutoSizer
              style={{ overflow: "visible", height: 0 }}
              renderProp={({ height, width }) =>
                height && width ? (
                  <GridLayout
                    className="transition-none layout"
                    layout={buildLayout(height)}
                    width={width}
                    gridConfig={{
                      cols: 12,
                      rowHeight: BASE_HEIGHT,
                      margin: [BASE_SPACE, BASE_SPACE],
                    }}
                    autoSize={true}
                    dragConfig={{ enabled: false }}
                    resizeConfig={{ enabled: false }}
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
                  </GridLayout>
                ) : null
              }
            />
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
