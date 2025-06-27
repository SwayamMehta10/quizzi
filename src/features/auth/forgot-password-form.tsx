import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordValues } from "./schemas";

// Forgot Password Form component
export function ForgotPasswordForm({ onSubmit, loading = false }: { 
  onSubmit: (values: ForgotPasswordValues) => void;
  loading?: boolean;
}) {
  const form = useForm<ForgotPasswordValues>({
	resolver: zodResolver(forgotPasswordSchema),
	defaultValues: {
	  email: "",
	},
  });

  const buttonText = loading ? "Loading..." : "Reset Password";

  return (
	<Form {...form}>
	  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 w-full">
		<FormField
		  control={form.control}
		  name="email"
		  render={({ field }) => (
			<FormItem>
			  <FormLabel>Email</FormLabel>
			  <FormControl>
				<Input placeholder="you@example.com" {...field} />
			  </FormControl>
			  <FormMessage />
			</FormItem>
		  )}
		/>
		<Button type="submit" className="w-full cursor-pointer" disabled={loading} variant="default">
		  {buttonText}
		</Button>
	  </form>
	</Form>
  );
}