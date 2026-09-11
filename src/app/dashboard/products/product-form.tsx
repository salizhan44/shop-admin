"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type {
  CategoryOptionPublic,
  ProductAdmin,
} from "@/lib/products.shared";
import { formatPriceSomInput } from "@/lib/products.shared";
import { SelectField } from "@/components/select-field";
import {
  UI_INPUT_CLASS,
  UI_LABEL_CLASS,
  UI_PRIMARY_BUTTON_CLASS,
  UI_SECONDARY_BUTTON_CLASS,
} from "@/lib/ui.shared";

const CREATE_NEW = "__new__";
const NONE = "";

export function ProductForm(props: {
  categories: CategoryOptionPublic[];
  product?: ProductAdmin;
}) {
  const router = useRouter();
  const isEdit = Boolean(props.product);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceSom, setPriceSom] = useState("");
  const [costSom, setCostSom] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [categoryChoice, setCategoryChoice] = useState(NONE);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryChoice, setSubcategoryChoice] = useState(NONE);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selectedCategoryId =
    categoryChoice !== NONE && categoryChoice !== CREATE_NEW
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
      { value: NONE, label: "Без категории" },
      ...props.categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
      { value: CREATE_NEW, label: "Новая категория" },
    ],
    [props.categories],
  );

  const subcategoryOptions = useMemo(() => {
    const options = [{ value: NONE, label: "Без подкатегории" }];
    if (categoryChoice !== CREATE_NEW) {
      for (const subcategory of subcategories) {
        options.push({ value: subcategory.id, label: subcategory.name });
      }
    }
    if (categoryChoice !== NONE) {
      options.push({ value: CREATE_NEW, label: "Новая подкатегория" });
    }
    return options;
  }, [categoryChoice, subcategories]);

  function fillFromProduct(product: ProductAdmin) {
    setName(product.name);
    setDescription(product.description);
    setPriceSom(formatPriceSomInput(product.priceCents));
    setCostSom(formatPriceSomInput(product.costCents));
    setStockQuantity(String(product.stockQuantity));
    setCategoryChoice(product.categoryId ?? NONE);
    setCategoryName("");
    setSubcategoryChoice(product.subcategoryId ?? NONE);
    setSubcategoryName("");
    setImageUrl(product.imageUrl);
    setError("");
  }

  function resetCreateForm() {
    setName("");
    setDescription("");
    setPriceSom("");
    setCostSom("0");
    setStockQuantity("0");
    setCategoryChoice(NONE);
    setCategoryName("");
    setSubcategoryChoice(NONE);
    setSubcategoryName("");
    setImageUrl("");
  }

  useEffect(() => {
    if (!open || !props.product) {
      return;
    }
    fillFromProduct(props.product);
  }, [open, props.product]);

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

    const creatingCategory = categoryChoice === CREATE_NEW;
    const creatingSubcategory = subcategoryChoice === CREATE_NEW;

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

    const body = {
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
      setOpen(false);
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setPending(false);
    }
  }

  const toggleClass = isEdit
    ? UI_SECONDARY_BUTTON_CLASS
    : UI_PRIMARY_BUTTON_CLASS;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className={toggleClass}
        >
          {open
            ? "Скрыть"
            : isEdit
              ? "Изменить"
              : "Добавить товар"}
        </button>
      </div>

      {open ? (
        <form
          onSubmit={onSubmit}
          className="flex max-w-md flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/70"
        >
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
          <div className={UI_LABEL_CLASS}>
            Фото
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-36 w-36 rounded-xl object-cover ring-1 ring-zinc-200/80"
              />
            ) : (
              <p className="text-zinc-400">Нет фото</p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                onPickImage(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              className="text-sm text-zinc-600"
            />
            {imageUrl ? (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="self-start text-sm text-zinc-500 underline"
              >
                Убрать
              </button>
            ) : null}
          </div>
          <label className={UI_LABEL_CLASS}>
            Категория
            <SelectField
              value={categoryChoice}
              options={categoryOptions}
              onChange={(value) => {
                setCategoryChoice(value);
                setSubcategoryChoice(NONE);
                setSubcategoryName("");
                if (value !== CREATE_NEW) {
                  setCategoryName("");
                }
              }}
            />
          </label>
          {categoryChoice === CREATE_NEW ? (
            <label className={UI_LABEL_CLASS}>
              Название категории
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className={UI_INPUT_CLASS}
              />
            </label>
          ) : null}
          <label className={UI_LABEL_CLASS}>
            Подкатегория
            <SelectField
              value={subcategoryChoice}
              options={subcategoryOptions}
              disabled={categoryChoice === NONE}
              onChange={(value) => {
                setSubcategoryChoice(value);
                if (value !== CREATE_NEW) {
                  setSubcategoryName("");
                }
              }}
            />
          </label>
          {subcategoryChoice === CREATE_NEW ? (
            <label className={UI_LABEL_CLASS}>
              Название подкатегории
              <input
                value={subcategoryName}
                onChange={(event) => setSubcategoryName(event.target.value)}
                className={UI_INPUT_CLASS}
              />
            </label>
          ) : null}
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
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className={UI_PRIMARY_BUTTON_CLASS}
          >
            {pending
              ? "Сохраняем…"
              : isEdit
                ? "Сохранить"
                : "Сохранить товар"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

