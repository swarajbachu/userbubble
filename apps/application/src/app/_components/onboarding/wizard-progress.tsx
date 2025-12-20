import { cn } from "@userbubble/ui";

type WizardProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function WizardProgress({
  currentStep,
  totalSteps,
}: WizardProgressProps) {
  const getStepClassName = (step: number): string => {
    if (step === currentStep) {
      return "w-8 bg-primary";
    }
    if (step < currentStep) {
      return "bg-primary/60";
    }
    return "bg-muted-foreground/20";
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          aria-current={step === currentStep ? "step" : undefined}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            getStepClassName(step)
          )}
          key={step}
        />
      ))}
    </div>
  );
}
