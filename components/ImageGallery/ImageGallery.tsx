import React, { useEffect, useState } from "react";
import { withFallback } from "vike-react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";

import { convertByteToKiloMegabyte } from "@/core/utils";
import { cn } from "@/core/lib/utils";
import type { CloudinaryResourceType } from "@/core/lib/types";
import { opacityVariants } from "@/core/constants/framerMotion";
import { useImages } from "@/core/hooks/api/useImages";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Container from "@/components/Container";

interface MediaGalleryProps {
  onImageSelected: (isChecked: boolean, image: CloudinaryResourceType) => void;
  onClearSelectedImage: () => void;
  selected: Array<CloudinaryResourceType>;
}

interface Deletion {
  state: string;
}

const ImageGallery = withFallback(
  ({ selected, onImageSelected, onClearSelectedImage }: MediaGalleryProps) => {
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [deletion, setDeletion] = useState<Deletion>();
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { pages, fetchNextPage, deleteMutation } = useImages(nextCursor, onClearSelectedImage, setDeletion);

    useEffect(() => {
      if (pages[0]) {
        setIsLoadingMore(false);
        setNextCursor(pages[pages.length - 1]?.data.result.next_cursor as string);
      }
    }, [pages]);

    return (
      <Container className="flex gap-4">
        <motion.div layout style={{ width: selected.length ? "75%" : "100%" }} className="h-[460px] overflow-y-auto">
          {Array.isArray(pages) && (
            <AnimatePresence>
              <motion.ul
                key="key"
                variants={opacityVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 m-0 p-0"
              >
                {pages.map((page) => {
                  return page?.data.result.resources.map((image) => {
                    const isChecked = selected.find((item) => item.secure_url === image.secure_url) ? true : false;

                    return (
                      <li key={image.public_id} className="bg-card">
                        <div className="relative group">
                          <Label
                            className={cn(
                              "absolute group-hover:opacity-100 transition-opacity top-3 left-3 p-1",
                              isChecked && "opacity-100",
                              !isChecked && "opacity-0",
                            )}
                            htmlFor={image.public_id}
                          >
                            <span className="sr-only">Select Image &quot;{image.public_id}&quot;</span>
                            <Checkbox
                              className={cn(
                                "w-6 h-6 rounded-full bg-card-foreground shadow",
                                isChecked && "border-primary",
                                !isChecked && "border-card-foreground",
                              )}
                              id={image.public_id}
                              onCheckedChange={() => {
                                onImageSelected(isChecked, image);
                              }}
                              checked={isChecked}
                              disabled={!isChecked && selected.length > 0}
                            />
                          </Label>
                          <div
                            className={cn(
                              "block cursor-pointer rounded-xl border-4 transition-[border]",
                              isChecked && "border-primary",
                              !isChecked && "border-card",
                            )}
                            onClick={() => {
                              onImageSelected(isChecked, image);
                            }}
                          >
                            <img
                              width={image.width}
                              height={image.height}
                              src={image.secure_url}
                              alt={image.display_name}
                              className="object-cover object-center w-full h-36 max-w-full rounded-lg"
                            />
                          </div>
                        </div>
                      </li>
                    );
                  });
                })}
              </motion.ul>
            </AnimatePresence>
          )}
          {nextCursor && (
            <div className="flex justify-center mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsLoadingMore(true);
                  fetchNextPage();
                }}
              >
                {isLoadingMore && <Loader2 className="animate-spin" />}Load more
              </Button>
            </div>
          )}
        </motion.div>
        <AnimatePresence>
          {!!selected.length && (
            <motion.div
              className="bg-muted p-3 text-nowrap rounded-md"
              key="image-panel"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "25%" }}
              exit={{ opacity: 0, width: 0 }}
            >
              <img
                width={selected[0].width}
                height={selected[0].height}
                src={selected[0].secure_url}
                alt={selected[0].display_name}
                className="object-cover object-center w-full h-36 max-w-full rounded-lg"
              />
              <div className="mt-2 text-wrap">{selected[0].display_name}</div>
              <dl className="mt-2">
                <div className="flex items-center">
                  <dt className="w-20 text-xs">Format</dt>
                  <dd className="text-sm">{selected[0].format}</dd>
                </div>

                <div className="flex items-center">
                  <dt className="w-20 text-xs">File size</dt>
                  <dd className="text-sm">{convertByteToKiloMegabyte(selected[0].bytes)}</dd>
                </div>

                <div className="flex items-center">
                  <dt className="w-20 text-xs">Dimension</dt>
                  <dd className="text-sm">
                    {selected[0].width} x {selected[0].height}
                  </dd>
                </div>
              </dl>
              <Button
                type="button"
                variant="link"
                className="p-0 flex justify-center items-center text-sm text-destructive"
                onClick={() => {
                  setDeletion({ state: "deleting" });
                  deleteMutation.mutate({ publicId: selected[0].public_id });
                }}
              >
                {deletion?.state === "deleting" ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Delete permanently
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    );
  },
  () => (
    <Container className="h-[460px] flex items-center justify-center">
      <div>Loading Images...</div>
    </Container>
  ),
  ({ retry, error }) => (
    <Container className="h-[460px]">
      <div>Failed to load Images: {error.message}</div>
      <Button variant="destructive" onClick={() => retry()}>
        <RotateCcw />
        Retry
      </Button>
    </Container>
  ),
);

export default ImageGallery;
