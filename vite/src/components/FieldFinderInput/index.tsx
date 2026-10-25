import {
  allColumnsRecursiveAtom,
  navigatorCollectionPathAtom,
  propertyListAtom,
} from "@/atoms/navigator";
import { uniq } from "lodash";
import React, { ReactElement } from "react";
import { useAtomValue } from "jotai";
import InputComboBox from "../InputComboBox";

interface IFieldFinderInputProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: HTMLInputElement;
  placeholder?: string;
  onSelect?: (value: string) => void;
}

const FieldFinderInput = ({
  value = "",
  onChange,
  onSelect,
  inputRef,
  placeholder,
}: IFieldFinderInputProps): ReactElement => {
  const collectionPath = useAtomValue(navigatorCollectionPathAtom);
  const allColumnsRecursive = useAtomValue(allColumnsRecursiveAtom);
  const propertyList = useAtomValue(propertyListAtom(collectionPath));

  const items = uniq([...allColumnsRecursive, ...propertyList]);

  return (
    <InputComboBox
      items={items}
      selectedItem={value}
      handleSelectedItemChange={onChange}
      inputRef={inputRef}
      onSelect={onSelect}
      placeholder={placeholder}
    />
  );
};

export default FieldFinderInput;
