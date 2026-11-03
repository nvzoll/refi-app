import {
  actionAddPathExpander,
  actionImportDocs,
} from "@/atoms/firestore.action";
import { globalHotKeys } from "@/atoms/hotkeys";
import { actionSubmitQuery } from "@/atoms/navigator.action";
import {
  importCollectionPathAtom,
  importFileAtom,
  isImportModalAtom,
} from "@/atoms/ui";
import { notifyErrorPromise } from "@/atoms/ui.action";
import {
  ignoreBackdropEvent,
  isCollection,
  readerFilePromise,
} from "@/utils/common";
import { Button } from "@zendeskgarden/react-buttons";
import {
  Checkbox,
  Field,
  FileUpload,
  Input,
  Label,
  Message,
} from "@zendeskgarden/react-forms";
import {
  Body,
  Footer,
  FooterItem,
  Header,
  Modal,
} from "@zendeskgarden/react-modals";
import csvtojson from "csvtojson";
import React, { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Controller, useForm } from "react-hook-form";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import SelectComboBox from "../SelectComboBox";

type ImportFormValues = {
  path: string;
  autoId: boolean;
  idField: string;
  autoParseJSON: boolean;
};

const ImportModal = () => {
  const collectionPath = useAtomValue(importCollectionPathAtom);
  const [file, setFile] = useAtom(importFileAtom);
  const [docs, setDocs] = useState<any[]>([]);
  const { register, handleSubmit, formState, watch, control } =
    useForm<ImportFormValues>({
      mode: "onChange",
      defaultValues: {
        path: collectionPath,
        autoId: true,
        idField: "__id__",
        autoParseJSON: true,
      },
    });

  const isAutoId = watch("autoId");

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ["application/json", "text/comma-separated-values", "text/csv"],
    onDrop,
    multiple: false,
  });

  const setShowImportModal = useSetAtom(isImportModalAtom);

  const onSubmit = (value: any) => {
    // TODO: If there is really large list, we should show loading somewhere
    actionImportDocs(value.path, docs, {
      idField: value.isAutoId ? null : value.idField,
      autoParseJSON: fileType === "csv" && value.autoParseJSON,
    })
      .then(() => {
        setFile(undefined);
        setShowImportModal(false);
        actionAddPathExpander([value.path]); // Assume that imported success we will also have new path
        if (value.path === collectionPath) {
          // Auto query again if current view same as imported path
          actionSubmitQuery();
          globalHotKeys.RESET_PROPERTY.handler(null);
        }
      })
      .catch(notifyErrorPromise);
  };

  const parseJSONDocFile = (data: string): any[] => {
    const fileData = JSON.parse(data);
    return Array.isArray(fileData) ? fileData : [fileData];
  };

  const parseCSVDocFile = (data: string): Promise<any[]> => {
    return new Promise((resolve) => {
      csvtojson().fromString(data).then(resolve);
    });
  };

  useEffect(() => {
    // TODO: Migrate me to worker to reduce the UI thread workload
    if (file) {
      readerFilePromise(file).then((fileData) => {
        if (file.type.indexOf("csv") >= 0) {
          parseCSVDocFile(fileData).then(setDocs);
        } else {
          setDocs(parseJSONDocFile(fileData));
        }
      });
    } else {
      setDocs([]);
    }
  }, [file]);

  const handleOnCancel = () => {
    setShowImportModal(false);
    setFile(undefined);
  };

  const fileType = useMemo(() => {
    if (file) {
      if (file.type.indexOf("csv") >= 0) {
        return "csv";
      }
      return "json";
    }

    return "";
  }, [file]);

  const idField = useMemo(() => {
    if (fileType && !isAutoId && docs[0]) {
      if (fileType === "csv") {
        const sampleColumn = Object.keys(docs[0]);
        return (
          <Field>
            <Label>Id field</Label>
            <Controller
              control={control}
              name="idField"
              render={({ field: { onChange, value, ref } }) => (
                <SelectComboBox
                  className="mt-2"
                  items={sampleColumn}
                  selectedItem={value}
                  handleSelectedItemChange={onChange}
                />
              )}
            />
          </Field>
        );
      }
      return (
        <Field>
          <Label>Id field</Label>
          <Input
            isCompact
            {...register("idField")}
          />
        </Field>
      );
    }

    return null;
  }, [fileType, isAutoId, docs, control, register]);

  // TODO: Path picker, validate path
  // TODO: Add analysis like: Preview import file, how many docs will be imported, warning if it not match current collection schema

  return (
    <Modal
      isAnimated={false}
      isLarge
      focusOnMount
      // backdropProps={{ onClick: ignoreBackdropEvent }}
      appendToNode={document.querySelector("#root") || undefined}
      className="w-3/5"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Header>Import data</Header>
        <Body className="p-4">
          <div className="space-y-4 h-96">
            <Field>
              <Label>Path</Label>
              <Controller
                control={control}
                name="path"
                rules={{
                  validate: (value) =>
                    isCollection(value) || "It must be collection path",
                  required: true,
                }}
                render={({
                  field: { onChange, value, ref },
                  fieldState: { invalid },
                }) => (
                  <Input
                    isCompact
                    value={value}
                    validation={invalid ? "error" : "success"}
                    onChange={(e) => onChange(e.target.value)}
                    ref={ref}
                  />
                )}
              />
              {formState.errors.path && (
                <Message validation="error">
                  {formState.errors.path.message}
                </Message>
              )}
            </Field>
            <Field>
              <FileUpload {...getRootProps()} isDragging={isDragActive}>
                {isDragActive ? (
                  <span>Drop JSON/CSV file here</span>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    {file ? (
                      file.name
                    ) : (
                      <span>Choose a JSON/CSV file to import</span>
                    )}
                  </div>
                )}
                <Input {...getInputProps()} />
              </FileUpload>
            </Field>
            <Field>
              <Controller
                control={control}
                name="autoId"
                render={({ field: { onChange, value, ref } }) => (
                  <Checkbox
                    ref={ref}
                    checked={value}
                    onChange={() => onChange(!value)}
                  >
                    <Label>Auto generate ID</Label>
                  </Checkbox>
                )}
              />
            </Field>
            {idField}
            {fileType === "csv" && (
              <Field>
                <Controller
                  control={control}
                  name="autoParseJSON"
                  render={({ field: { onChange, value, ref } }) => (
                    <Checkbox
                      ref={ref}
                      checked={value}
                      onChange={() => onChange(!value)}
                    >
                      <Label>Auto parse JSON value</Label>
                    </Checkbox>
                  )}
                />
              </Field>
            )}
          </div>
        </Body>
        <Footer className="p-4">
          <FooterItem>
            <Button size="small" onClick={() => handleOnCancel()}>
              Cancel
            </Button>
          </FooterItem>
          <FooterItem>
            <Button
              size="small"
              disabled={!formState.isValid || docs.length <= 0}
              onClick={handleSubmit(onSubmit)}
              isPrimary
              type="submit"
            >
              Import {docs.length > 0 && `${docs.length} doc(s)`}
            </Button>
          </FooterItem>
        </Footer>
      </form>
    </Modal>
  );
};

export default ImportModal;
