"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type {
  CategoryOptionPublic,
  ProductAdmin,
} from "@/lib/products.shared";
import { formatPriceSomInput } from "@/lib/products.shared";
import {
  PRODUCT_DISCOUNT_KINDS,
  isProductDiscountKind,
  productDiscountKindFromFields,
  productDiscountKindLabel,
  type ProductDiscountKind,
} from "@/lib/product-discount.shared";
import { SelectField } from "@/components/select-field";
import { ModalDialog } from "@/components/modal-dialog";
import {
  ADMIN_MENU_BG,
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_THEME_BUTTON_CLASS,
} from "@/lib/ui.shared";
import { ProductDeleteButton } from "./product-delete-button";
import { ProductImageField } from "./product-image-field";
import {
  PRODUCT_CATEGORY_CREATE_NEW,
  PRODUCT_CATEGORY_NONE,
  ProductCreateTaxonomyFields,
} from "./product-create-taxonomy-fields";

export function ProductForm(props: {
  categories: CategoryOptionPublic[];
  product?: ProductAdmin;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(props.product);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceSom, setPriceSom] = useState("");
  const [costSom, setCostSom] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [categoryChoice, setCategoryChoice] = useState(PRODUCT_CATEGORY_NONE);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryChoice, setSubcategoryChoice] = useState(
    PRODUCT_CATEGORY_NONE,
  );
  const [subcategoryName, setSubcategoryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [discountKind, setDiscountKind] =
    useState<ProductDiscountKind>("none");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountSom, setDiscountSom] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedCategoryId =
    categoryChoice !== PRODUCT_CATEGORY_NONE &&
    categoryChoice !== PRODUCT_CATEGORY_CREATE_NEW
      ? categoryChoice
      : "";

  const subcategories = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }
    return (
      props.categories.find((item) => item.id === selectedCategoryId)
        ?.subcategories ?? []
    );
  }, [props.categories, selectedCategoryId]);

  const categoryOptions = useMemo(
    () => [
      { value: PRODUCT_CATEGORY_NONE, label: "Без категории" },
      ...props.categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
      { value: PRODUCT_CATEGORY_CREATE_NEW, label: "Новая категория" },
    ],
    [props.categories],
  );

  const subcategoryOptions = useMemo(() => {
    const options = [
      { value: PRODUCT_CATEGORY_NONE, label: "Без подкатегории" },
    ];
    if (categoryChoice !== PRODUCT_CATEGORY_CREATE_NEW) {
      for (const subcategory of subcategories) {
        options.push({ value: subcategory.id, label: subcategory.name });
      }
    }
    if (categoryChoice !== PRODUCT_CATEGORY_NONE) {
      options.push({
        value: PRODUCT_CATEGORY_CREATE_NEW,
        label: "Новая подкатегория",
      });
    }
    return options;
  }, [categoryChoice, subcategories]);

  function fillFromProduct(product: ProductAdmin) {
    setName(product.name);
    setDescription(product.description);
    setPriceSom(formatPriceSomInput(product.listPriceCents));
    setCostSom(formatPriceSomInput(product.costCents));
    setStockQuantity(String(product.stockQuantity));
    setCategoryChoice(product.categoryId ?? PRODUCT_CATEGORY_NONE);
    setCategoryName("");
    setSubcategoryChoice(product.subcategoryId ?? PRODUCT_CATEGORY_NONE);
    setSubcategoryName("");
    setImageUrl(product.imageUrl);
    setDiscountKind(productDiscountKindFromFields(product));
    setDiscountPercent(
      product.discountPercent != null ? String(product.discountPercent) : "",
    );
    setDiscountSom(
      product.discountAmountCents != null
        ? formatPriceSomInput(product.discountAmountCents)
        : "",
    );
    setError("");
  }

  function resetCreateForm() {
    setName("");
    setDescription("");
    setPriceSom("");
    setCostSom("0");
    setStockQuantity("0");
    setCategoryChoice(PRODUCT_CATEGORY_NONE);
    setCategoryName("");
    setSubcategoryChoice(PRODUCT_CATEGORY_NONE);
    setSubcategoryName("");
    setImageUrl("");
    setDiscountKind("none");
    setDiscountPercent("");
    setDiscountSom("");
    setError("");
  }

  useEffect(() => {
    if (!props.open) {
      return;
    }
    if (props.product) {
      fillFromProduct(props.product);
      return;
    }
    resetCreateForm();
  }, [props.open, props.product]);

  function onPickImage(file: File | null) {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Нужна картинка JPEG/PNG/WebP");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Не удалось прочитать файл");
        return;
      }
      setImageUrl(reader.result);
      setError("");
    };
    reader.onerror = () => {
      setError("Не удалось прочитать файл");
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    const creatingCategory =
      !isEdit && categoryChoice === PRODUCT_CATEGORY_CREATE_NEW;
    const creatingSubcategory =
      !isEdit && subcategoryChoice === PRODUCT_CATEGORY_CREATE_NEW;

    if (creatingCategory && categoryName.trim().length === 0) {
      setError("Укажите название новой категории");
      setPending(false);
      return;
    }
    if (creatingSubcategory && subcategoryName.trim().length === 0) {
      setError("Укажите название новой подкатегории");
      setPending(false);
      return;
    }
    if (
      creatingSubcategory &&
      !creatingCategory &&
      selectedCategoryId.length === 0
    ) {
      setError("Для подкатегории выберите или создайте категорию");
      setPending(false);
      return;
    }

    const body =
      isEdit && props.product
        ? {
            name,
            description,
            priceSom,
            costSom: formatPriceSomInput(props.product.costCents),
            stockQuantity: String(props.product.stockQuantity),
            categoryId: props.product.categoryId ?? "",
            categoryName: "",
            subcategoryId: props.product.subcategoryId ?? "",
            subcategoryName: "",
            imageUrl,
            discountKind,
            discountPercent,
            discountSom,
          }
        : {
            name,
            description,
            priceSom,
            costSom,
            stockQuantity,
            categoryId: creatingCategory ? "" : selectedCategoryId,
            categoryName: creatingCategory ? categoryName.trim() : "",
            subcategoryId: creatingSubcategory ? "" : subcategoryChoice,
            subcategoryName: creatingSubcategory ? subcategoryName.trim() : "",
            imageUrl,
            discountKind,
            discountPercent,
            discountSom,
          };

    try {
      const response = await fetch(
        isEdit && props.product
          ? `/api/products/${props.product.id}`
          : "/api/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as
        | ApiErrorBody
        | { product: unknown };

      if (!response.ok) {
        setError(
          "error" in data
            ? data.error
            : isEdit
              ? "Не удалось обновить товар"
              : "Не удалось сохранить товар",
        );
        return;
      }

      if (!isEdit) {
        resetCreateForm();
      }
      props.onClose();
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  return (
    <ModalDialog
      open={props.open}
      title={isEdit ? "Редактировать товар" : "Новый товар"}
      onClose={props.onClose}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className={UI_LABEL_CLASS}>
          Название
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={UI_INPUT_CLASS}
          />
        </label>
        <label className={UI_LABEL_CLASS}>
          Описание
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`min-h-20 ${UI_INPUT_CLASS}`}
          />
        </label>
        <ProductImageField
          imageUrl={imageUrl}
          onPick={onPickImage}
          onClear={() => setImageUrl("")}
        />
        {isEdit ? null : (
          <ProductCreateTaxonomyFields
            categoryChoice={categoryChoice}
            categoryName={categoryName}
            subcategoryChoice={subcategoryChoice}
            subcategoryName={subcategoryName}
            categoryOptions={categoryOptions}
            subcategoryOptions={subcategoryOptions}
            onCategoryChange={(value) => {
              setCategoryChoice(value);
              setSubcategoryChoice(PRODUCT_CATEGORY_NONE);
              setSubcategoryName("");
              if (value !== PRODUCT_CATEGORY_CREATE_NEW) {
                setCategoryName("");
              }
            }}
            onCategoryNameChange={setCategoryName}
            onSubcategoryChange={(value) => {
              setSubcategoryChoice(value);
              if (value !== PRODUCT_CATEGORY_CREATE_NEW) {
                setSubcategoryName("");
              }
            }}
            onSubcategoryNameChange={setSubcategoryName}
          />
        )}
        <label className={UI_LABEL_CLASS}>
          Цена, сом
          <input
            required
            inputMode="decimal"
            value={priceSom}
            onChange={(event) => setPriceSom(event.target.value)}
            className={UI_INPUT_CLASS}
          />
        </label>
        <label className={UI_LABEL_CLASS}>
          Скидка
          <SelectField
            value={discountKind}
            onChange={(value) => {
              if (isProductDiscountKind(value)) {
                setDiscountKind(value);
              }
            }}
            options={PRODUCT_DISCOUNT_KINDS.map((kind) => ({
              value: kind,
              label: productDiscountKindLabel(kind),
            }))}
            aria-label="Тип скидки"
          />
        </label>
        {discountKind === "percent" ? (
          <label className={UI_LABEL_CLASS}>
            Процент
            <input
              inputMode="numeric"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              className={UI_INPUT_CLASS}
            />
          </label>
        ) : null}
        {discountKind === "amount" ? (
          <label className={UI_LABEL_CLASS}>
            Сумма скидки, сом
            <input
              inputMode="decimal"
              value={discountSom}
              onChange={(event) => setDiscountSom(event.target.value)}
              className={UI_INPUT_CLASS}
            />
          </label>
        ) : null}
        {isEdit ? null : (
          <>
            <label className={UI_LABEL_CLASS}>
              Себестоимость, сом
              <input
                required
                inputMode="decimal"
                value={costSom}
                onChange={(event) => setCostSom(event.target.value)}
                className={UI_INPUT_CLASS}
              />
            </label>
            <label className={UI_LABEL_CLASS}>
              Остаток, шт.
              <input
                required
                inputMode="numeric"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                className={UI_INPUT_CLASS}
              />
            </label>
          </>
        )}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={pending}
            className={`flex-1 ${UI_THEME_BUTTON_CLASS}`}
            style={{ backgroundColor: ADMIN_MENU_BG }}
          >
            {pending
              ? "Сохраняем…"
              : isEdit
                ? "Сохранить"
                : "Сохранить товар"}
          </button>
          {isEdit && props.product ? (
            <ProductDeleteButton
              productId={props.product.id}
              productName={props.product.name}
              onDeleted={props.onClose}
            />
          ) : null}
        </div>
      </form>
    </ModalDialog>
  );
}
