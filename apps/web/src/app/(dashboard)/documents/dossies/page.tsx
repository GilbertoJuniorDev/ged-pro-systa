import { redirect } from 'next/navigation';

export default function DossiesPage() {
  redirect('/documents?view=dossies');
}
