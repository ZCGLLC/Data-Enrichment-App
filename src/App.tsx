import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./Layout";
import { Companies, CompanyDetail } from "./pages/Companies";
import { ListDetail, Lists } from "./pages/Lists";
import { Analytics, Credits, Integrations, NotFound, Settings } from "./pages/More";
import { People, PersonDetail } from "./pages/People";
import { SequenceDetail, Sequences } from "./pages/Sequences";
import { Tasks } from "./pages/Tasks";
import { Today } from "./pages/Today";
import { StoreProvider } from "./store";

export function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Today />} />
            <Route path="people" element={<People />} />
            <Route path="people/:personId" element={<PersonDetail />} />
            <Route path="companies" element={<Companies />} />
            <Route path="companies/:companyId" element={<CompanyDetail />} />
            <Route path="lists" element={<Lists />} />
            <Route path="lists/:listId" element={<ListDetail />} />
            <Route path="sequences" element={<Sequences />} />
            <Route path="sequences/:sequenceId" element={<SequenceDetail />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="credits" element={<Credits />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
