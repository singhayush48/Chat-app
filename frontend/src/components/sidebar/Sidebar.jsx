import { Navbar } from '@/components/common/Navbar';
import { SearchBar } from '@/components/sidebar/SearchBar';
import { ConversationList } from '@/components/sidebar/ConversationList';

export function Sidebar() {
  return (
    <div className="flex h-full flex-col">
      <Navbar />
      <SearchBar />
      <ConversationList />
    </div>
  );
}
