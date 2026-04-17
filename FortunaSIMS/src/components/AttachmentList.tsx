type Attachment = {
  file_name?: string;
  file_path?: string;
  file_url?: string;
  attachment_file?: File | null;
};



type Props = {
  attachments: Attachment[];
};

const AttachmentList = ({ attachments = [] }: Props) => {
  if (!attachments || attachments.length === 0) {
    return <p className="text-gray-400 text-sm">No attachments</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((file, idx) => {

        // 🔥 HANDLE ALL CASES
        const fileUrl =
          file.file_path
            ? `http://localhost:5000/${file.file_path}` // from DB
            : file.file_url
            ? file.file_url // optional
            : file.attachment_file
            ? URL.createObjectURL(file.attachment_file) // 🔥 LIVE PREVIEW
            : "#";

        const fileName =
          file.file_name ||
          file.attachment_file?.name ||
          "File";

        return (
          <div
            key={idx}
            className="flex items-center justify-between p-2 border rounded"
          >
            <span className="text-sm text-gray-700 truncate">
              {fileName}
            </span>

            {fileUrl !== "#" && (
              <div className="flex gap-3">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  View
                </a>

                <a
                  href={fileUrl}
                  download
                  className="text-green-600 text-sm hover:underline"
                >
                  Download
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentList;