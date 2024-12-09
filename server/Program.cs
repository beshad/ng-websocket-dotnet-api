using System.Net.WebSockets;
using System.Text;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWebSockets();

app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        Console.WriteLine("WebSocket connection established");

        Random random = new Random();

        while (webSocket.State == WebSocketState.Open)
        {
            var timeData = new
            {
                value = random.Next(1, 10),
                time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
            };

            string jsonMessage = JsonConvert.SerializeObject(timeData);  // Serialize to JSON
            var bytes = Encoding.UTF8.GetBytes(jsonMessage);  // Convert JSON string to byte array

            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            await Task.Delay(3000); // Send data every 3 seconds
        }
    }
    else
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("WebSocket requests only.");
    }
});

app.Run();
