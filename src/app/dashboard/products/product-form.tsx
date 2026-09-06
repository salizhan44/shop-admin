"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ApiErrorBody } from "@/lib/auth.shared";
import type {
  CategoryOptionPublic,
  ProductAdmin,
} from "@/lib/products.shared";
import { formatPriceSomInput } from "@/lib/products.shared";

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

  function fillFromProduct(product: ProductAdmin) {
    setName(product.name);
    setDescription(product.description);
    setPriceSom(formatPriceSomInput(product.priceCents));
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

  const inputClass =
    "rounded-xl border-0 bg-white px-3.5 py-2.5 text-zinc-900 shadow-sm ring-1 ring-zinc-200/80 outline-none focus:ring-2 focus:ring-zinc-400/50";

  const toggleClass = isEdit
    ? "h-9 rounded border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
    : "rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800";

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
          className="flex max-w-md flex-col gap-4 rounded-2xl bg-zinc-50/80 p-3.5 ring-1 ring-zinc-200/60"
        >
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Название
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Описание
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={`min-h-20 ${inputClass}`}
            />
          </label>
          <div className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Фото товара
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-36 w-36 rounded-xl object-cover ring-1 ring-zinc-200/80"
              />
            ) : (
              <p className="text-zinc-500">Пока без фото</p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                onPickImage(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
              className="text-sm"
            />
            {imageUrl ? (
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="self-start text-sm text-zinc-600 underline"
              >
                Убрать фото
              </button>
            ) : null}
          </div>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Категория
            <select
              value={categoryChoice}
              onChange={(event) => {
                setCategoryChoice(event.target.value);
                setSubcategoryChoice(NONE);
                setSubcategoryName("");
                if (event.target.value !== CREATE_NEW) {
                  setCategoryName("");
                }
              }}
              className={inputClass}
            >
              <option value={NONE}>Без категории</option>
              {props.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value={CREATE_NEW}>+ Новая категория…</option>
            </select>
          </label>
          {categoryChoice === CREATE_NEW ? (
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
              Название категории
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Например, Мука"
                className={inputClass}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Подкатегория
            <select
              value={subcategoryChoice}
              onChange={(event) => {
                setSubcategoryChoice(event.target.value);
                if (event.target.value !== CREATE_NEW) {
                  setSubcategoryName("");
                }
              }}
              disabled={categoryChoice === NONE}
              className={`${inputClass} disabled:opacity-60`}
            >
              <option value={NONE}>Без подкатегории</option>
              {categoryChoice === CREATE_NEW ? null : (
                <>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </>
              )}
              {categoryChoice !== NONE ? (
                <option value={CREATE_NEW}>+ Новая подкатегория…</option>
              ) : null}
            </select>
          </label>
          {subcategoryChoice === CREATE_NEW ? (
            <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
              Название подкатегории
              <input
                value={subcategoryName}
                onChange={(event) => setSubcategoryName(event.target.value)}
                placeholder="Например, Высший сорт"
                className={inputClass}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Цена, сом
            <input
              required
              inputMode="decimal"
              placeholder="199.90"
              value={priceSom}
              onChange={(event) => setPriceSom(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-zinc-700">
            Остаток на складе, шт.
            <input
              required
              inputMode="numeric"
              placeholder="0"
              value={stockQuantity}
              onChange={(event) => setStockQuantity(event.target.value)}
              className={inputClass}
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending
              ? "Сохраняем…"
              : isEdit
                ? "Сохранить изменения"
                : "Сохранить товар"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
