import { QUERIES } from "@/lib/queries";
import { DestinationContents } from "./DestinationContents";

export default async function DestinationPage(props: {
  params: Promise<{ destinationId: string }>;
}) {
  const params = await props.params;
  const parsedDestinationId = parseInt(params.destinationId);
  const destinationData = await QUERIES.getDestinationDetails(
    parsedDestinationId
  );
  if (!destinationData.data) {
    return <div>Destination not found</div>;
  }
  console.log(destinationData);
  return <DestinationContents destDetails={destinationData.data[0]} />;
}
