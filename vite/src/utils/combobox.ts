import {
  useCombobox,
  UseComboboxState,
  UseComboboxStateChangeOptions,
} from "downshift";

export const ignoreInputClick = <Item>(
  state: UseComboboxState<Item>,
  { type, changes }: UseComboboxStateChangeOptions<Item>
): Partial<UseComboboxState<Item>> =>
  type === useCombobox.stateChangeTypes.InputClick ? state : changes;
