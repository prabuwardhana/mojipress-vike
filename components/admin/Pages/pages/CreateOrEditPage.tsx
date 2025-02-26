import React, { useEffect, useMemo, useState } from "react";

import { useForm, SubmitHandler, SubmitErrorHandler, useFieldArray } from "react-hook-form";
import { usePageContext } from "vike-react/usePageContext";
import { withFallback } from "vike-react-query";
import { toast } from "sonner";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";
import { zodResolver } from "@hookform/resolvers/zod";

import ImageManagerDialog from "@/components/admin/Dialogs/CoverImageDialog";
import { PageWidgetButton } from "@/components/admin/PageWidgetButton";
import { SkeletonPostEditor } from "@/components/admin/Skeletons";
import { CodeBlock } from "@/components/admin/CodeBlock";
import ImageSetter from "@/components/admin/ImageSetter";
import SaveStatus from "@/components/admin/SaveStatus";
import PageTitle from "@/components/admin/AdminPageTitle";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Accordion from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import PageWidget from "./PageWidget";

import { usePageWidgetsStore } from "@/store/pageComponentsStore";
import { dateStringOptions } from "@/constants/dateTimeOptions";
import type { CloudinaryResourceType, PageWidgetType, PageType } from "@/lib/types";
import { pageFormSchema } from "@/lib/schemas";
import { cn, slugify } from "@/lib/utils";
import { usePageWidgets } from "@/hooks/api/usePageComponents";
import { useAutoSave } from "@/hooks/useAutoSave";
import { usePages } from "@/hooks/api/usePages";

import { CirclePlus, FileJson2, Globe, GlobeLock, Loader2, RotateCcw, Save } from "lucide-react";

export const CreateOrEditPage = withFallback(
  () => {
    const { user, routeParams } = usePageContext();
    const pageTitle = routeParams.id ? "Edit Page" : "Add New Page";

    const initialPageData = useMemo(
      () => ({
        _id: null,
        title: "",
        slug: "",
        fields: [],
        coverImageUrl: "",
        published: false,
        publishedAt: null,
        author: user?._id,
        updatedAt: null,
      }),
      [],
    );

    // global states
    const { pageWidgets, setPageWidgets } = usePageWidgetsStore();

    // local states
    const [tab, setTab] = useState("gallery");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [publishedAt, setPublishedAt] = useState<string | null>();
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedCoverImages, setSelectedCoverImages] = useState<Array<CloudinaryResourceType>>([]);
    const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>("");
    const [pageData, setPageData] = useState<PageType>(initialPageData);

    const { pageWidgetsQuery } = usePageWidgets();
    const { pageQuery, upsertMutation, publishMutation } = usePages(routeParams.id, setIsPublishing, setIsUpdating);

    // 1. Define our form.
    const formMethods = useForm<PageType>({
      // Integrate zod as the schema validation library
      resolver: async (data, context, options) => {
        return zodResolver(pageFormSchema)(data, context, options);
      },
      // form default states
      defaultValues: {
        title: pageData.title,
        slug: pageData.slug,
        fields: pageData.fields,
        coverImageUrl: pageData.coverImageUrl,
      },
    });

    const { fields, append, remove } = useFieldArray<PageType, "fields", "fieldId">({
      control: formMethods.control,
      name: "fields",
      keyName: "fieldId",
    });

    // 2. Define the form submit handler.
    const handleSubmit: SubmitHandler<PageType> = (formData) => {
      // Saves the content to DB.
      triggerManualSave({ ...pageData, ...formData });
    };

    const handleSubmitError: SubmitErrorHandler<PageType> = (formData) => {
      console.log(formData);
      if (formData.fields?.root?.message) toast(formData.fields?.root?.message);
    };

    // In edit mode, loads the content from DB.
    useEffect(() => {
      if (routeParams.id && pageQuery) {
        const page: PageType = pageQuery.data;
        // replace pageData with the new one from the DB
        setPageData(page);
        setCoverImageUrl(page.coverImageUrl);
        setLastSavedAt(page.updatedAt);

        if (page.publishedAt) {
          const date = new Date(page.publishedAt as Date);
          setPublishedAt(date.toLocaleDateString("en-US", dateStringOptions));
        } else {
          setPublishedAt(null);
        }
      }
    }, [routeParams.id, pageQuery?.data]);

    // The following useEffect expects formMethods as dependency
    // when formMethods.reset is called within useEffect.
    // Adding the entire return value of useForm to a useEffect dependency list
    // may lead to infinite loops.
    // https://github.com/react-hook-form/react-hook-form/issues/12463
    const reset = useMemo(() => formMethods.reset, [formMethods.reset]);

    // Reset the form states when the previously stored
    // page data has been loaded sucessfuly from the DB
    useEffect(() => {
      reset({
        title: pageData.title,
        slug: pageData.slug,
        fields: pageData.fields,
        coverImageUrl: pageData.coverImageUrl,
      });
    }, [reset, pageData]);

    useEffect(() => {
      if (pageWidgetsQuery.data) setPageWidgets(pageWidgetsQuery.data);
    }, [pageWidgetsQuery]);

    useEffect(() => {
      if (selectedCoverImages.length > 0) formMethods.setValue("coverImageUrl", selectedCoverImages[0].secure_url);
    }, [selectedCoverImages]);

    const { triggerManualSave, isPendingSave, isSaving, isError } = useAutoSave({
      onSave: (data) => {
        if (!data.title || !data.slug) return;
        setIsUpdating(true);
        const currentTime = new Date();
        setLastSavedAt(currentTime);
        upsertMutation.mutate(data as PageType);
      },
    });

    const onTabChange = (value: string) => {
      setTab(value);
    };

    const onImageSelected = (isChecked: boolean, image: CloudinaryResourceType) => {
      setSelectedCoverImages((prev) => {
        if (!isChecked) {
          const ret = Array.from(new Set([...(prev || []), image]));
          return ret.filter((id) => id === image);
        } else {
          return prev.filter((id) => id !== image);
        }
      });
    };

    const onClearSelectedImage = () => {
      setSelectedCoverImages([]);
    };

    const onSetCoverImage = () => {
      setCoverImageUrl(selectedCoverImages[0].secure_url);
      formMethods.setValue("coverImageUrl", selectedCoverImages[0].secure_url);
      setIsDialogOpen(false);
    };

    const onPublish = () => {
      setIsPublishing(true);
      publishMutation.mutate(routeParams.id);
    };

    const droppable = useDroppable({
      id: "page-widget-droppable-area",
      data: {
        isPageWidgetDroppableArea: true,
      },
    });

    useDndMonitor({
      onDragEnd: (event) => {
        const { active, over } = event;

        if (!active || !over) return;

        const isPageWidgetBtn = active?.data?.current?.isPageWidgetBtn;

        if (isPageWidgetBtn) {
          const type = active?.data?.current?.type;
          const selectedPageWidget = pageWidgets.find((item) => item.title === type) as PageWidgetType;
          const fieldNamesArray = selectedPageWidget?.fields.map((field) => `${field.name}_${field.type}`);
          const fieldLabelsArray = selectedPageWidget?.fields.map((field) => `${field.label}`);
          const fieldNamesObj = fieldNamesArray.reduce((o, key) => ({ ...o, [key]: "" }), {});

          append({
            ...fieldNamesObj,
            fieldLabels: fieldLabelsArray.join(","),
            fieldsTitle: selectedPageWidget.title,
            fieldId: `${selectedPageWidget.title.replace(/\s/g, "-")}-${fields.length}`,
          });
        }
      },
    });

    return (
      <>
        <Form {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(handleSubmit, handleSubmitError)}>
            <div className="flex flex-col gap-y-6 xl:flex-row xl:gap-x-6">
              <main className="basis-3/4 space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-col justify-center md:flex-row md:justify-between">
                    <PageTitle>{pageTitle}</PageTitle>
                    <div className="flex justify-between gap-x-6">
                      <SaveStatus
                        savedAt={lastSavedAt}
                        isPendingSave={isPendingSave}
                        isSaving={isSaving}
                        isError={isError}
                      />
                      <Button type="submit" size={"sm"} className="bg-primary text-primary-foreground">
                        {routeParams.id ? isUpdating ? <Loader2 className="animate-spin" /> : <Save /> : <CirclePlus />}
                        {routeParams.id ? "Update Page" : "Create Page"}
                      </Button>
                      {routeParams.id && (
                        <Button
                          type="button"
                          size={"sm"}
                          onClick={onPublish}
                          className={cn(
                            pageData.published && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                            !pageData.published && "bg-primary hover:bg-primary/90 text-primary-foreground",
                          )}
                        >
                          {isPublishing ? (
                            <Loader2 className="animate-spin" />
                          ) : pageData.published ? (
                            <GlobeLock />
                          ) : (
                            <Globe />
                          )}
                          {pageData.published ? "Unpublish" : "Publish"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {publishedAt && (
                    <div className="flex justify-end text-xs text-primary">published on {publishedAt}</div>
                  )}
                </div>
                <FormField
                  control={formMethods.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-normal text-md text-primary">Title</FormLabel>
                      <FormControl>
                        <Input
                          className="box-border h-12 rounded-none border-t-0 border-l-0 border-r-0 border-b border-primary bg-transparent px-0 py-4 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 md:text-2xl"
                          placeholder="Enter Title Here"
                          onChange={(e) => {
                            // send back data to hook form (update formState)
                            field.onChange(e.target.value);

                            // create slug for the title
                            const slug = slugify(e.target.value);

                            // Set the value for the slug field
                            formMethods.setValue("slug", slug);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={formMethods.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-normal text-md text-primary">Generated Slug</FormLabel>
                      <FormControl>
                        <Input
                          className="box-border h-12 rounded-none border-t-0 border-l-0 border-r-0 border-b border-primary bg-transparent px-0 py-4 text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <div className="flex gap-4 items-center">
                    <div className="text-md text-primary">Page Content ({fields.length})</div>
                    {pageQuery?.data.pageFieldsJson && (
                      <Dialog>
                        <DialogTrigger
                          type="button"
                          className="flex gap-1 items-center bg-transparent text-xs text-foreground hover:text-primary border rounded-md border-foreground hover:border-primary p-2"
                        >
                          <FileJson2 size={16} />
                          Preview Page Content in JSON
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] md:max-w-screen-md">
                          <DialogHeader>
                            <DialogTitle>Page Content JSON</DialogTitle>
                            <DialogDescription>Preview of the page content in JSON data.</DialogDescription>
                          </DialogHeader>
                          <div className="rounded-md h-[460px] overflow-y-auto">
                            <CodeBlock code={pageQuery?.data.pageFieldsJson} language="json" />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <div
                    ref={droppable.setNodeRef}
                    className={cn(
                      "border border-dashed border-primary/70 space-y-2 rounded-sm min-h-32 p-4 mb-10 bg-primary/10 flex flex-col flex-grow items-center justify-start",
                      droppable.isOver && "ring-2 ring-primary/20",
                    )}
                  >
                    {!droppable.isOver && fields.length === 0 && (
                      <p className="text-xl text-primary/70 flex flex-grow items-center">Drop a page widget here.</p>
                    )}
                    {fields.length > 0 &&
                      fields.map((field, index) => (
                        <PageWidget
                          key={field._id?.toString() + index.toString()}
                          pageWidgetIndex={index}
                          field={field}
                          remove={remove}
                        />
                      ))}
                    {droppable.isOver && (
                      <div className="w-full">
                        <div className="h-[120px] rounded-sm bg-primary/20"></div>
                      </div>
                    )}
                  </div>
                </div>
                <FormField
                  control={formMethods.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="hidden"
                          className="box-border rounded-md border bg-background text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </main>
              <aside className="sticky top-[84px] flex h-[calc(100vh-160px)] basis-1/4 flex-col overflow-y-hidden">
                <Accordion className="border-b" title="Hero Image" open={true}>
                  <ImageSetter
                    type="Hero"
                    imageUrl={coverImageUrl}
                    onSetImageClick={() => setIsDialogOpen(true)}
                    onRemoveImageClick={() => {
                      setCoverImageUrl("");
                      setSelectedCoverImages([]);
                    }}
                  />
                </Accordion>
                <Accordion title="Page Widgets" open={true} className="border-b space-y-2">
                  {pageWidgets.map((pageWidget) => (
                    <PageWidgetButton key={pageWidget._id?.toString()} pageWidget={pageWidget} />
                  ))}
                </Accordion>
              </aside>
            </div>
          </form>
        </Form>
        <ImageManagerDialog
          title="Hero Image"
          buttonText="Set Hero Image"
          tab={tab}
          selected={selectedCoverImages}
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          onTabChange={onTabChange}
          onImageSelected={onImageSelected}
          onClearSelectedImage={onClearSelectedImage}
          onSetImage={onSetCoverImage}
        />
      </>
    );
  },
  () => <SkeletonPostEditor />,
  ({ retry, error }) => (
    <div>
      <div>Failed to load Post: {error.message}</div>
      <Button variant="destructive" onClick={() => retry()}>
        <RotateCcw />
        Retry
      </Button>
    </div>
  ),
);
