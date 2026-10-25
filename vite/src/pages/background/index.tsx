import {
  isImportModalAtom,
  isModalCommandAtom,
  isShowPreviewChangeModalAtom,
} from "@/atoms/ui";
import ImportModal from "@/components/ImportModal";
import React from "react";
import { useAtomValue } from "jotai";
import Commander from "./Commander";
import PreviewChanges from "./PreviewChanges";

const Background = () => {
  const isShowChangeModal = useAtomValue(isShowPreviewChangeModalAtom);
  const isShowModalCommand = useAtomValue(isModalCommandAtom);
  const isShowImportModal = useAtomValue(isImportModalAtom);

  return (
    <>
      {isShowChangeModal && <PreviewChanges />}
      {isShowModalCommand && <Commander />}
      {isShowImportModal && <ImportModal />}
    </>
  );
};

export default Background;
