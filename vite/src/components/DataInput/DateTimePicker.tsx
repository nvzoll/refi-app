import classNames from "classnames";
import moment from "moment";
import React, { ReactElement, useState } from "react";
import Datetime from "react-datetime";
import "./DateTimePicker.css";
import { Timestamp } from "firebase/firestore";

interface IDateTimePickerProps {
  value: Timestamp;
  onChange: (newValue: Timestamp) => void;
}

const dateFormat = "MM/DD/YYYY";
const timeFormat = "HH:mm:ss";
const format = `${dateFormat} ${timeFormat}`;

const DateTimePicker = ({
  value,
  onChange,
}: IDateTimePickerProps): ReactElement => {
  const [isValid, setValid] = useState(true);

  const handleOnTimeChange = (newValue: string | moment.Moment) => {
    setValid(typeof newValue !== "string");
  };

  const handleOnClose = (event: string | Event | moment.Moment) => {
    if (moment.isMoment(event)) {
      if (
        moment(value.toDate()).format(format) !== moment(event).format(format)
      ) {
        onChange(Timestamp.fromDate(event.toDate()));
      }
    }
  };

  return (
    <Datetime
      closeOnSelect
      initialValue={value.toDate()}
      onChange={handleOnTimeChange}
      onClose={handleOnClose as any}
      dateFormat={dateFormat}
      timeFormat={timeFormat}
      className="h-full"
      inputProps={{
        className: classNames(
          "w-full h-full outline-none ring-inset focus:bg-blue-100 p-1.5 border-none focus:ring-1 text-sm dark:text-gray-200 bg-transparent",
          {
            ["focus:ring-red-400"]: !isValid,
            ["focus:ring-blue-400"]: isValid,
          }
        ),
      }}
    />
  );
};

export default DateTimePicker;
