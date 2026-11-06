import { navigatorPathAtom } from "@/atoms/navigator";
import { getProjectId } from "@/utils/common";
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAtom } from "jotai";

const URLSynchronizer = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [path, setPath] = useAtom(navigatorPathAtom);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!projectId) {
      return;
    }
    navigate({
      pathname: `/${projectId}`,
      hash: path,
    });
  }, [path]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    window.projectId = projectId;
    const urlPath = location.hash.replace("#", "");
    setPath(urlPath || "/");
    document.title = `${getProjectId()} - Refi app`;
  }, []);

  return null;
};

export default URLSynchronizer;
