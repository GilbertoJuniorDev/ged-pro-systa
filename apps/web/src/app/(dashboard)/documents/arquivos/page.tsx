import { redirect } from 'next/navigation';

export default function ArquivosPage() {
  redirect('/documents?view=arquivos');
}
