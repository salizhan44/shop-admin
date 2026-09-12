import type { SelectOption } from "@/lib/ui.shared";
import { UI_INPUT_CLASS, UI_LABEL_CLASS } from "@/lib/ui.shared";
import { SelectField } from "@/components/select-field";

export const PRODUCT_CATEGORY_CREATE_NEW = "__new__";
export const PRODUCT_CATEGORY_NONE = "";

export function ProductCreateTaxonomyFields(props: {
  categoryChoice: string;
  categoryName: string;
  subcategoryChoice: string;
  subcategoryName: string;
  categoryOptions: SelectOption[];
  subcategoryOptions: SelectOption[];
  onCategoryChange: (value: string) => void;
  onCategoryNameChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onSubcategoryNameChange: (value: string) => void;
}) {
  return (
    <>
      <label className={UI_LABEL_CLASS}>
        Категория
        <SelectField
          value={props.categoryChoice}
          options={props.categoryOptions}
          onChange={props.onCategoryChange}
        />
      </label>
      {props.categoryChoice === PRODUCT_CATEGORY_CREATE_NEW ? (
        <label className={UI_LABEL_CLASS}>
          Название категории
          <input
            value={props.categoryName}
            onChange={(event) => props.onCategoryNameChange(event.target.value)}
            className={UI_INPUT_CLASS}
          />
        </label>
      ) : null}
      <label className={UI_LABEL_CLASS}>
        Подкатегория
        <SelectField
          value={props.subcategoryChoice}
          options={props.subcategoryOptions}
          disabled={props.categoryChoice === PRODUCT_CATEGORY_NONE}
          onChange={props.onSubcategoryChange}
        />
      </label>
      {props.subcategoryChoice === PRODUCT_CATEGORY_CREATE_NEW ? (
        <label className={UI_LABEL_CLASS}>
          Название подкатегории
          <input
            value={props.subcategoryName}
            onChange={(event) =>
              props.onSubcategoryNameChange(event.target.value)
            }
            className={UI_INPUT_CLASS}
          />
        </label>
      ) : null}
    </>
  );
}
