// Code generated by protoc-gen-go-dxrpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-dxrpc v0.0.1
// - protoc              v3.20.3
// source: example/testing/rpc.proto

package rpc

import (
	context "context"
	errors "errors"
	dxrpc "github.com/dxos/dxos/dxrpc"
	proto "google.golang.org/protobuf/proto"
	emptypb "google.golang.org/protobuf/types/known/emptypb"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the dxrpc package it is being compiled against.
const _ = dxrpc.SupportPackageIsVersion1

// TestServiceClient is the client API for TestService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type TestServiceClient interface {
	TestCall(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (*TestRpcResponse, error)
	VoidCall(ctx context.Context, in *emptypb.Empty, opts ...dxrpc.CallOption) (*emptypb.Empty, error)
}

type testServiceClient struct {
	cc dxrpc.ClientConnInterface
}

func NewTestServiceClient(cc dxrpc.ClientConnInterface) TestServiceClient {
	return &testServiceClient{cc}
}

func (c *testServiceClient) TestCall(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (*TestRpcResponse, error) {
	out := new(TestRpcResponse)
	err := c.cc.Invoke(ctx, "example.testing.rpc.TestService.TestCall", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *testServiceClient) VoidCall(ctx context.Context, in *emptypb.Empty, opts ...dxrpc.CallOption) (*emptypb.Empty, error) {
	out := new(emptypb.Empty)
	err := c.cc.Invoke(ctx, "example.testing.rpc.TestService.VoidCall", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// TestServiceServer is the server API for TestService service.
// All implementations must embed UnimplementedTestServiceServer
// for forward compatibility
type TestServiceServer interface {
	TestCall(context.Context, *TestRpcRequest) (*TestRpcResponse, error)
	VoidCall(context.Context, *emptypb.Empty) (*emptypb.Empty, error)
	mustEmbedUnimplementedTestServiceServer()
}

// UnimplementedTestServiceServer must be embedded to have forward compatible implementations.
type UnimplementedTestServiceServer struct {
}

func (UnimplementedTestServiceServer) TestCall(context.Context, *TestRpcRequest) (*TestRpcResponse, error) {
	return nil, errors.New("method TestCall not implemented")
}
func (UnimplementedTestServiceServer) VoidCall(context.Context, *emptypb.Empty) (*emptypb.Empty, error) {
	return nil, errors.New("method VoidCall not implemented")
}
func (UnimplementedTestServiceServer) mustEmbedUnimplementedTestServiceServer() {}

// UnsafeTestServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to TestServiceServer will
// result in compilation errors.
type UnsafeTestServiceServer interface {
	mustEmbedUnimplementedTestServiceServer()
}

func RegisterTestServiceServer(s dxrpc.ServiceRegistrar, srv TestServiceServer) {
	s.RegisterService(&TestService_ServiceDesc, srv)
}

func _TestService_TestCall_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(TestRpcRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(TestServiceServer).TestCall(ctx, in)
}

func _TestService_VoidCall_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(emptypb.Empty)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(TestServiceServer).VoidCall(ctx, in)
}

// TestService_ServiceDesc is the dxrpc.ServiceDesc for TestService service.
// It's only intended for direct use with dxrpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var TestService_ServiceDesc = dxrpc.ServiceDesc{
	ServiceName: "example.testing.rpc.TestService",
	HandlerType: (*TestServiceServer)(nil),
	Methods: []dxrpc.MethodDesc{
		{
			MethodName: "TestCall",
			Handler:    _TestService_TestCall_Handler,
		},
		{
			MethodName: "VoidCall",
			Handler:    _TestService_VoidCall_Handler,
		},
	},
	Streams:  []dxrpc.StreamDesc{},
	Metadata: "example/testing/rpc.proto",
}

// TestStreamServiceClient is the client API for TestStreamService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type TestStreamServiceClient interface {
	TestCall(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (TestStreamService_TestCallClient, error)
}

type testStreamServiceClient struct {
	cc dxrpc.ClientConnInterface
}

func NewTestStreamServiceClient(cc dxrpc.ClientConnInterface) TestStreamServiceClient {
	return &testStreamServiceClient{cc}
}

func (c *testStreamServiceClient) TestCall(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (TestStreamService_TestCallClient, error) {
	stream, err := c.cc.NewStream(ctx, &TestStreamService_ServiceDesc.Streams[0], "example.testing.rpc.TestStreamService.TestCall", opts...)
	if err != nil {
		return nil, err
	}
	x := &testStreamServiceTestCallClient{stream}
	if err := x.ClientStream.SendMsg(in); err != nil {
		return nil, err
	}
	return x, nil
}

type TestStreamService_TestCallClient interface {
	Recv() (*TestRpcResponse, error)
	dxrpc.ClientStream
}

type testStreamServiceTestCallClient struct {
	dxrpc.ClientStream
}

func (x *testStreamServiceTestCallClient) Recv() (*TestRpcResponse, error) {
	m := new(TestRpcResponse)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

// TestStreamServiceServer is the server API for TestStreamService service.
// All implementations must embed UnimplementedTestStreamServiceServer
// for forward compatibility
type TestStreamServiceServer interface {
	TestCall(*TestRpcRequest, TestStreamService_TestCallServer) error
	mustEmbedUnimplementedTestStreamServiceServer()
}

// UnimplementedTestStreamServiceServer must be embedded to have forward compatible implementations.
type UnimplementedTestStreamServiceServer struct {
}

func (UnimplementedTestStreamServiceServer) TestCall(*TestRpcRequest, TestStreamService_TestCallServer) error {
	return errors.New("method TestCall not implemented")
}
func (UnimplementedTestStreamServiceServer) mustEmbedUnimplementedTestStreamServiceServer() {}

// UnsafeTestStreamServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to TestStreamServiceServer will
// result in compilation errors.
type UnsafeTestStreamServiceServer interface {
	mustEmbedUnimplementedTestStreamServiceServer()
}

func RegisterTestStreamServiceServer(s dxrpc.ServiceRegistrar, srv TestStreamServiceServer) {
	s.RegisterService(&TestStreamService_ServiceDesc, srv)
}

func _TestStreamService_TestCall_Handler(srv interface{}, stream dxrpc.ServerStream) error {
	m := new(TestRpcRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(TestStreamServiceServer).TestCall(m, &testStreamServiceTestCallServer{stream})
}

type TestStreamService_TestCallServer interface {
	Send(*TestRpcResponse) error
	dxrpc.ServerStream
}

type testStreamServiceTestCallServer struct {
	dxrpc.ServerStream
}

func (x *testStreamServiceTestCallServer) Send(m *TestRpcResponse) error {
	return x.ServerStream.SendMsg(m)
}

// TestStreamService_ServiceDesc is the dxrpc.ServiceDesc for TestStreamService service.
// It's only intended for direct use with dxrpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var TestStreamService_ServiceDesc = dxrpc.ServiceDesc{
	ServiceName: "example.testing.rpc.TestStreamService",
	HandlerType: (*TestStreamServiceServer)(nil),
	Methods:     []dxrpc.MethodDesc{},
	Streams: []dxrpc.StreamDesc{
		{
			StreamName:    "TestCall",
			Handler:       _TestStreamService_TestCall_Handler,
			ServerStreams: true,
		},
	},
	Metadata: "example/testing/rpc.proto",
}

// TestServiceWithStreamsClient is the client API for TestServiceWithStreams service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type TestServiceWithStreamsClient interface {
	RequestTestStream(ctx context.Context, in *TestStreamRpcRequest, opts ...dxrpc.CallOption) (*TestRpcResponse, error)
	CloseTestStream(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (*TestStreamRpcResponse, error)
}

type testServiceWithStreamsClient struct {
	cc dxrpc.ClientConnInterface
}

func NewTestServiceWithStreamsClient(cc dxrpc.ClientConnInterface) TestServiceWithStreamsClient {
	return &testServiceWithStreamsClient{cc}
}

func (c *testServiceWithStreamsClient) RequestTestStream(ctx context.Context, in *TestStreamRpcRequest, opts ...dxrpc.CallOption) (*TestRpcResponse, error) {
	out := new(TestRpcResponse)
	err := c.cc.Invoke(ctx, "example.testing.rpc.TestServiceWithStreams.RequestTestStream", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *testServiceWithStreamsClient) CloseTestStream(ctx context.Context, in *TestRpcRequest, opts ...dxrpc.CallOption) (*TestStreamRpcResponse, error) {
	out := new(TestStreamRpcResponse)
	err := c.cc.Invoke(ctx, "example.testing.rpc.TestServiceWithStreams.CloseTestStream", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// TestServiceWithStreamsServer is the server API for TestServiceWithStreams service.
// All implementations must embed UnimplementedTestServiceWithStreamsServer
// for forward compatibility
type TestServiceWithStreamsServer interface {
	RequestTestStream(context.Context, *TestStreamRpcRequest) (*TestRpcResponse, error)
	CloseTestStream(context.Context, *TestRpcRequest) (*TestStreamRpcResponse, error)
	mustEmbedUnimplementedTestServiceWithStreamsServer()
}

// UnimplementedTestServiceWithStreamsServer must be embedded to have forward compatible implementations.
type UnimplementedTestServiceWithStreamsServer struct {
}

func (UnimplementedTestServiceWithStreamsServer) RequestTestStream(context.Context, *TestStreamRpcRequest) (*TestRpcResponse, error) {
	return nil, errors.New("method RequestTestStream not implemented")
}
func (UnimplementedTestServiceWithStreamsServer) CloseTestStream(context.Context, *TestRpcRequest) (*TestStreamRpcResponse, error) {
	return nil, errors.New("method CloseTestStream not implemented")
}
func (UnimplementedTestServiceWithStreamsServer) mustEmbedUnimplementedTestServiceWithStreamsServer() {
}

// UnsafeTestServiceWithStreamsServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to TestServiceWithStreamsServer will
// result in compilation errors.
type UnsafeTestServiceWithStreamsServer interface {
	mustEmbedUnimplementedTestServiceWithStreamsServer()
}

func RegisterTestServiceWithStreamsServer(s dxrpc.ServiceRegistrar, srv TestServiceWithStreamsServer) {
	s.RegisterService(&TestServiceWithStreams_ServiceDesc, srv)
}

func _TestServiceWithStreams_RequestTestStream_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(TestStreamRpcRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(TestServiceWithStreamsServer).RequestTestStream(ctx, in)
}

func _TestServiceWithStreams_CloseTestStream_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(TestRpcRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(TestServiceWithStreamsServer).CloseTestStream(ctx, in)
}

// TestServiceWithStreams_ServiceDesc is the dxrpc.ServiceDesc for TestServiceWithStreams service.
// It's only intended for direct use with dxrpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var TestServiceWithStreams_ServiceDesc = dxrpc.ServiceDesc{
	ServiceName: "example.testing.rpc.TestServiceWithStreams",
	HandlerType: (*TestServiceWithStreamsServer)(nil),
	Methods: []dxrpc.MethodDesc{
		{
			MethodName: "RequestTestStream",
			Handler:    _TestServiceWithStreams_RequestTestStream_Handler,
		},
		{
			MethodName: "CloseTestStream",
			Handler:    _TestServiceWithStreams_CloseTestStream_Handler,
		},
	},
	Streams:  []dxrpc.StreamDesc{},
	Metadata: "example/testing/rpc.proto",
}

// PingServiceClient is the client API for PingService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type PingServiceClient interface {
	Ping(ctx context.Context, in *PingRequest, opts ...dxrpc.CallOption) (*PingReponse, error)
}

type pingServiceClient struct {
	cc dxrpc.ClientConnInterface
}

func NewPingServiceClient(cc dxrpc.ClientConnInterface) PingServiceClient {
	return &pingServiceClient{cc}
}

func (c *pingServiceClient) Ping(ctx context.Context, in *PingRequest, opts ...dxrpc.CallOption) (*PingReponse, error) {
	out := new(PingReponse)
	err := c.cc.Invoke(ctx, "example.testing.rpc.PingService.Ping", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// PingServiceServer is the server API for PingService service.
// All implementations must embed UnimplementedPingServiceServer
// for forward compatibility
type PingServiceServer interface {
	Ping(context.Context, *PingRequest) (*PingReponse, error)
	mustEmbedUnimplementedPingServiceServer()
}

// UnimplementedPingServiceServer must be embedded to have forward compatible implementations.
type UnimplementedPingServiceServer struct {
}

func (UnimplementedPingServiceServer) Ping(context.Context, *PingRequest) (*PingReponse, error) {
	return nil, errors.New("method Ping not implemented")
}
func (UnimplementedPingServiceServer) mustEmbedUnimplementedPingServiceServer() {}

// UnsafePingServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to PingServiceServer will
// result in compilation errors.
type UnsafePingServiceServer interface {
	mustEmbedUnimplementedPingServiceServer()
}

func RegisterPingServiceServer(s dxrpc.ServiceRegistrar, srv PingServiceServer) {
	s.RegisterService(&PingService_ServiceDesc, srv)
}

func _PingService_Ping_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(PingRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(PingServiceServer).Ping(ctx, in)
}

// PingService_ServiceDesc is the dxrpc.ServiceDesc for PingService service.
// It's only intended for direct use with dxrpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var PingService_ServiceDesc = dxrpc.ServiceDesc{
	ServiceName: "example.testing.rpc.PingService",
	HandlerType: (*PingServiceServer)(nil),
	Methods: []dxrpc.MethodDesc{
		{
			MethodName: "Ping",
			Handler:    _PingService_Ping_Handler,
		},
	},
	Streams:  []dxrpc.StreamDesc{},
	Metadata: "example/testing/rpc.proto",
}

// TestAnyServiceClient is the client API for TestAnyService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type TestAnyServiceClient interface {
	TestCall(ctx context.Context, in *MessageWithAny, opts ...dxrpc.CallOption) (*MessageWithAny, error)
}

type testAnyServiceClient struct {
	cc dxrpc.ClientConnInterface
}

func NewTestAnyServiceClient(cc dxrpc.ClientConnInterface) TestAnyServiceClient {
	return &testAnyServiceClient{cc}
}

func (c *testAnyServiceClient) TestCall(ctx context.Context, in *MessageWithAny, opts ...dxrpc.CallOption) (*MessageWithAny, error) {
	out := new(MessageWithAny)
	err := c.cc.Invoke(ctx, "example.testing.rpc.TestAnyService.TestCall", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// TestAnyServiceServer is the server API for TestAnyService service.
// All implementations must embed UnimplementedTestAnyServiceServer
// for forward compatibility
type TestAnyServiceServer interface {
	TestCall(context.Context, *MessageWithAny) (*MessageWithAny, error)
	mustEmbedUnimplementedTestAnyServiceServer()
}

// UnimplementedTestAnyServiceServer must be embedded to have forward compatible implementations.
type UnimplementedTestAnyServiceServer struct {
}

func (UnimplementedTestAnyServiceServer) TestCall(context.Context, *MessageWithAny) (*MessageWithAny, error) {
	return nil, errors.New("method TestCall not implemented")
}
func (UnimplementedTestAnyServiceServer) mustEmbedUnimplementedTestAnyServiceServer() {}

// UnsafeTestAnyServiceServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to TestAnyServiceServer will
// result in compilation errors.
type UnsafeTestAnyServiceServer interface {
	mustEmbedUnimplementedTestAnyServiceServer()
}

func RegisterTestAnyServiceServer(s dxrpc.ServiceRegistrar, srv TestAnyServiceServer) {
	s.RegisterService(&TestAnyService_ServiceDesc, srv)
}

func _TestAnyService_TestCall_Handler(srv interface{}, ctx context.Context, dec func(proto.Message) error) (proto.Message, error) {
	in := new(MessageWithAny)
	if err := dec(in); err != nil {
		return nil, err
	}
	return srv.(TestAnyServiceServer).TestCall(ctx, in)
}

// TestAnyService_ServiceDesc is the dxrpc.ServiceDesc for TestAnyService service.
// It's only intended for direct use with dxrpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var TestAnyService_ServiceDesc = dxrpc.ServiceDesc{
	ServiceName: "example.testing.rpc.TestAnyService",
	HandlerType: (*TestAnyServiceServer)(nil),
	Methods: []dxrpc.MethodDesc{
		{
			MethodName: "TestCall",
			Handler:    _TestAnyService_TestCall_Handler,
		},
	},
	Streams:  []dxrpc.StreamDesc{},
	Metadata: "example/testing/rpc.proto",
}