import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

type FormFieldContextValue = {
  name: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

type FormFieldProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> =
  ControllerProps<TFieldValues, TName>;

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: FormFieldProps<TFieldValues, TName>
) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const formContext = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField must be used within <FormField>");
  }

  const { getFieldState, formState } = formContext;
  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    id: fieldContext.name,
    name: fieldContext.name,
    formItemId: `${fieldContext.name}-form-item`,
    formDescriptionId: `${fieldContext.name}-form-item-description`,
    formMessageId: `${fieldContext.name}-form-item-message`,
    ...fieldState,
  };
};

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  )
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium text-slate-700", className)}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot ref={ref} id={formItemId} aria-describedby={`${formDescriptionId} ${formMessageId}`} {...props} />
    );
  }
);
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <p ref={ref} id={formDescriptionId} className={cn("text-xs text-slate-500", className)} {...props} />
    );
  }
);
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cn("text-xs text-red-600", className)} {...props}>
        {body}
      </p>
    );
  }
);
FormMessage.displayName = "FormMessage";

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
